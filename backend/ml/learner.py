# backend/ml/learner.py
# Online Learning Engine — retrains model as users give feedback
import pickle, os, threading, json
from datetime import datetime
from collections import deque
import pandas as pd
from sklearn.linear_model import SGDClassifier
from sklearn.feature_extraction.text import HashingVectorizer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder
from ml.preprocessing import clean_text

FEEDBACK_FILE  = "data/processed/feedback.csv"
ONLINE_MODEL   = "ml/models/online_model.pkl"
RETRAIN_EVERY  = 10   # retrain after every N feedback submissions
_lock          = threading.Lock()

# ---------------------------------------------------------------------------
# SGDClassifier supports partial_fit() — true online learning
# HashingVectorizer is stateless (no vocabulary to update), perfect for streaming
# ---------------------------------------------------------------------------
def build_online_pipeline():
    return Pipeline([
        ("vec", HashingVectorizer(
            preprocessor=clean_text,
            ngram_range=(1, 2),
            n_features=2**18,      # fixed feature space, no refit needed
            alternate_sign=False,
        )),
        ("clf", SGDClassifier(
            loss="log_loss",       # gives predict_proba support
            penalty="l2",
            alpha=1e-4,
            max_iter=1,
            tol=None,
            warm_start=True,
            class_weight="balanced",
            random_state=42,
        )),
    ])

def load_online_model() -> Pipeline:
    """Load existing online model or create fresh one."""
    if os.path.exists(ONLINE_MODEL):
        with _lock:
            return pickle.load(open(ONLINE_MODEL, "rb"))
    return build_online_pipeline()

def save_online_model(model: Pipeline):
    os.makedirs("ml/models", exist_ok=True)
    with _lock:
        pickle.dump(model, open(ONLINE_MODEL, "wb"))

def log_feedback(text: str, true_label: int):
    """
    Append one labelled sample to feedback CSV.
    true_label: 1 = phishing, 0 = legitimate
    """
    os.makedirs("data/processed", exist_ok=True)
    row = pd.DataFrame([{"text": text, "label": true_label,
                          "ts": datetime.utcnow().isoformat()}])
    row.to_csv(FEEDBACK_FILE, mode="a",
               header=not os.path.exists(FEEDBACK_FILE), index=False)

def partial_fit_one(text: str, true_label: int):
    """
    Immediately update the online model with one new labelled sample.
    This runs in a background thread so the API response is not blocked.
    """
    def _fit():
        model = load_online_model()
        cleaned = clean_text(text)
        # SGDClassifier needs classes on first call
        try:
            model.named_steps["clf"].partial_fit(
                model.named_steps["vec"].transform([cleaned]),
                [true_label],
                classes=[0, 1]
            )
        except Exception:
            # If pipeline not yet fitted, do a cold start with this sample
            model.fit([cleaned], [true_label])
        save_online_model(model)
        log_feedback(text, true_label)

    t = threading.Thread(target=_fit, daemon=True)
    t.start()

def batch_retrain_from_feedback():
    """
    Full retrain of the online model from ALL accumulated feedback.
    Called automatically every RETRAIN_EVERY submissions.
    Also callable manually via POST /admin/retrain
    """
    if not os.path.exists(FEEDBACK_FILE):
        return {"status": "no feedback yet"}

    df = pd.read_csv(FEEDBACK_FILE).dropna()
    if len(df) < 5:
        return {"status": "not enough feedback", "count": len(df)}

    model = build_online_pipeline()
    BATCH = 64
    for i in range(0, len(df), BATCH):
        chunk = df.iloc[i:i+BATCH]
        X = chunk["text"].tolist()
        y = chunk["label"].astype(int).tolist()
        try:
            model.named_steps["clf"].partial_fit(
                model.named_steps["vec"].transform(X),
                y, classes=[0, 1]
            )
        except Exception:
            model.fit(X, y)

    save_online_model(model)
    stats = {"status": "retrained", "samples": len(df),
             "phishing": int(df["label"].sum()),
             "legitimate": int((df["label"]==0).sum()),
             "timestamp": datetime.utcnow().isoformat()}
    json.dump(stats, open("ml/models/retrain_log.json","w"), indent=2)
    print(f"[Retrain] {stats}")
    return stats

def get_feedback_count() -> int:
    if not os.path.exists(FEEDBACK_FILE): return 0
    try: return len(pd.read_csv(FEEDBACK_FILE))
    except: return 0