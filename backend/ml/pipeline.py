# backend/ml/pipeline.py
import logging
import pickle
from pathlib import Path

from ml.learner import ONLINE_MODEL, load_online_model

logger = logging.getLogger(__name__)

BASE_MODEL_PATH = Path(__file__).resolve().parent / "models" / "best_model.pkl"
ONLINE_WEIGHT = 0.35
BASE_WEIGHT = 0.65


def load_base_model():
    with BASE_MODEL_PATH.open("rb") as model_file:
        return pickle.load(model_file)


def predict_blended(text: str, base_model) -> tuple[float, str]:
    """
    Returns (prob_phishing, source). Blends base + online model when an
    online model exists and can produce probabilities.
    """
    base_prob = float(base_model.predict_proba([text])[0][1])

    if ONLINE_MODEL.exists():
        try:
            online_model = load_online_model()
            vec = online_model.named_steps["vec"]
            clf = online_model.named_steps["clf"]
            online_prob = float(clf.predict_proba(vec.transform([text]))[0][1])
            blended = (BASE_WEIGHT * base_prob) + (ONLINE_WEIGHT * online_prob)
            return round(blended, 4), "blended"
        except Exception as exc:
            logger.warning("Online model unavailable; falling back to base model: %s", exc)

    return round(base_prob, 4), "base_only"
