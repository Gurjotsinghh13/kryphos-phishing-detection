# backend/ml/preprocessing.py

import re, string
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from sklearn.base import BaseEstimator, TransformerMixin

try:
    STOP_WORDS = set(stopwords.words("english"))
except LookupError:
    nltk.download("stopwords", quiet=True)
    STOP_WORDS = set(stopwords.words("english"))

STEMMER = PorterStemmer()

URGENCY_WORDS = ["urgent","immediately","verify","suspended","limited","expire",
                 "act now","confirm","update","validate","click here","login",
                 "account locked","verify now","final notice","last chance"]

THREAT_WORDS  = ["account","password","credit card","ssn","security","bank",
                 "paypal","amazon","ebay","apple","verify your","unusual activity",
                 "unauthorized","billing","invoice","winner","prize","free"]

def clean_text(text: str) -> str:
    if not isinstance(text, str): return ""
    text = text.lower()
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'http\S+', ' URL ', text)
    text = re.sub(r'\d+', ' NUM ', text)
    text = text.translate(str.maketrans('','', string.punctuation))
    tokens = [STEMMER.stem(t) for t in text.split()
              if t not in STOP_WORDS and len(t) > 2]
    return " ".join(tokens)

def extract_phishing_features(text: str) -> dict:
    text_lower = text.lower()
    return {
        "urgency_count":  sum(1 for w in URGENCY_WORDS if w in text_lower),
        "threat_count":   sum(1 for w in THREAT_WORDS  if w in text_lower),
        "has_html":       1 if bool(re.search(r'<[a-z]', text_lower)) else 0,
        "word_count":     len(text.split()),
        "caps_ratio":     round(sum(1 for c in text if c.isupper()) / max(len(text),1), 3),
    }

class TextCleaner(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None): return self
    def transform(self, X): return [clean_text(t) for t in X]