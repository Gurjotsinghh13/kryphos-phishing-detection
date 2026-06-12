# backend/ml/learner.py
import json
import logging
import pickle
import threading
from datetime import datetime
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import HashingVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.pipeline import Pipeline

from ml.preprocessing import clean_text

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[1]
FEEDBACK_FILE = BACKEND_DIR / "data" / "processed" / "feedback.csv"
ONLINE_MODEL = BACKEND_DIR / "ml" / "models" / "online_model.pkl"
RETRAIN_LOG = BACKEND_DIR / "ml" / "models" / "retrain_log.json"
RETRAIN_EVERY = 10
_lock = threading.Lock()


def build_online_pipeline() -> Pipeline:
    return Pipeline(
        [
            (
                "vec",
                HashingVectorizer(
                    preprocessor=clean_text,
                    ngram_range=(1, 2),
                    n_features=2**18,
                    alternate_sign=False,
                ),
            ),
            (
                "clf",
                SGDClassifier(
                    loss="log_loss",
                    penalty="l2",
                    alpha=1e-4,
                    max_iter=1,
                    tol=None,
                    warm_start=True,
                    random_state=42,
                ),
            ),
        ]
    )


def load_online_model() -> Pipeline:
    """Load existing online model or create a fresh one."""
    with _lock:
        if ONLINE_MODEL.exists():
            with ONLINE_MODEL.open("rb") as model_file:
                return pickle.load(model_file)
    return build_online_pipeline()


def save_online_model(model: Pipeline):
    ONLINE_MODEL.parent.mkdir(parents=True, exist_ok=True)
    with _lock:
        with ONLINE_MODEL.open("wb") as model_file:
            pickle.dump(model, model_file)


def log_feedback(text: str, true_label: int):
    """Append one labelled sample to the feedback CSV."""
    FEEDBACK_FILE.parent.mkdir(parents=True, exist_ok=True)
    row = pd.DataFrame(
        [{"text": text, "label": int(true_label), "ts": datetime.utcnow().isoformat()}]
    )
    with _lock:
        row.to_csv(
            FEEDBACK_FILE,
            mode="a",
            header=not FEEDBACK_FILE.exists(),
            index=False,
        )


def partial_fit_one(text: str, true_label: int):
    """
    Immediately update the online model with one labelled sample.
    FastAPI runs this function as a BackgroundTask, so no nested thread is needed.
    """
    label = int(true_label)
    if label not in (0, 1):
        raise ValueError("true_label must be 0 or 1")

    ONLINE_MODEL.parent.mkdir(parents=True, exist_ok=True)
    with _lock:
        if ONLINE_MODEL.exists():
            with ONLINE_MODEL.open("rb") as model_file:
                model = pickle.load(model_file)
        else:
            model = build_online_pipeline()

        vectorized = model.named_steps["vec"].transform([text])
        model.named_steps["clf"].partial_fit(vectorized, [label], classes=[0, 1])

        with ONLINE_MODEL.open("wb") as model_file:
            pickle.dump(model, model_file)

        row = pd.DataFrame(
            [{"text": text, "label": label, "ts": datetime.utcnow().isoformat()}]
        )
        row.to_csv(
            FEEDBACK_FILE,
            mode="a",
            header=not FEEDBACK_FILE.exists(),
            index=False,
        )

    logger.info("Applied online feedback update label=%s", label)


def batch_retrain_from_feedback():
    """
    Full retrain of the online model from all accumulated feedback.
    Called automatically every RETRAIN_EVERY submissions and by admin route.
    """
    if not FEEDBACK_FILE.exists():
        return {"status": "no feedback yet"}

    df = pd.read_csv(FEEDBACK_FILE).dropna(subset=["text", "label"])
    if len(df) < 5:
        return {"status": "not enough feedback", "count": len(df)}

    model = build_online_pipeline()
    batch_size = 64
    for start in range(0, len(df), batch_size):
        chunk = df.iloc[start : start + batch_size]
        X = chunk["text"].astype(str).tolist()
        y = chunk["label"].astype(int).tolist()
        model.named_steps["clf"].partial_fit(
            model.named_steps["vec"].transform(X),
            y,
            classes=[0, 1],
        )

    save_online_model(model)
    stats = {
        "status": "retrained",
        "samples": len(df),
        "phishing": int(df["label"].astype(int).sum()),
        "legitimate": int((df["label"].astype(int) == 0).sum()),
        "timestamp": datetime.utcnow().isoformat(),
    }
    RETRAIN_LOG.parent.mkdir(parents=True, exist_ok=True)
    with RETRAIN_LOG.open("w") as log_file:
        json.dump(stats, log_file, indent=2)
    logger.info("Online model retrained: %s", stats)
    return stats


def get_feedback_count() -> int:
    if not FEEDBACK_FILE.exists():
        return 0
    try:
        return len(pd.read_csv(FEEDBACK_FILE))
    except Exception:
        logger.exception("Could not read feedback count")
        return 0
