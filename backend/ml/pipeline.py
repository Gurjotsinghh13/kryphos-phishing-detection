# backend/ml/pipeline.py
# Unified prediction — blends base model + online model
import pickle, os
from ml.learner import load_online_model, ONLINE_MODEL
from ml.preprocessing import clean_text

BASE_MODEL_PATH   = "ml/models/best_model.pkl"
ONLINE_WEIGHT     = 0.35   # online model contributes 35% of final score
BASE_WEIGHT       = 0.65   # base model contributes 65%

def load_base_model():
    return pickle.load(open(BASE_MODEL_PATH, "rb"))

def predict_blended(text: str, base_model) -> tuple[float, str]:
    """
    Returns (prob_phishing, source) where source tells which model(s) were used.
    Blends base + online model if online model exists and has been trained.
    """
    cleaned = clean_text(text)

    # Base model prediction
    base_prob = float(base_model.predict_proba([text])[0][1])

    # Online model prediction (if available)
    if os.path.exists(ONLINE_MODEL):
        try:
            online_model = load_online_model()
            vec   = online_model.named_steps["vec"]
            clf   = online_model.named_steps["clf"]
            X_vec = vec.transform([cleaned])
            online_prob = float(clf.predict_proba(X_vec)[0][1])
            blended = (BASE_WEIGHT * base_prob) + (ONLINE_WEIGHT * online_prob)
            return round(blended, 4), "blended"
        except Exception:
            pass   # fall back to base only

    return round(base_prob, 4), "base_only"