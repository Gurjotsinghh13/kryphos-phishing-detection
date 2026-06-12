# backend/app/analyzer.py
import re, numpy as np
from .url_analyzer import extract_url_features, PHISH_WORDS
from .preprocessing import extract_phishing_features, URGENCY_WORDS, THREAT_WORDS

def analyze_email(subject:str, body:str, urls:list[str], model) -> dict:
    full_text = f"{subject} {body}"

    # 1. ML Prediction
    prob_phishing = float(model.predict_proba([full_text])[0][1])
    prediction    = "phishing" if prob_phishing > 0.5 else "legitimate"
    confidence    = round(max(prob_phishing, 1-prob_phishing) * 100, 1)

    # 2. URL Analysis
    url_results, suspicious_urls = [], []
    for url in (urls or []):
        feats = extract_url_features(url)
        risk_score = (
            feats["is_ip_address"]   * 30 +
            feats["suspicious_tld"]  * 25 +
            feats["phish_word_count"]* 10 +
            feats["is_shortener"]    * 20 +
            (1 - feats["is_https"])  * 15 +
            min(feats["subdomain_count"] * 5, 20)
        )
        if risk_score >= 30:
            suspicious_urls.append({"url": url, "score": risk_score,
                                    "features": feats})
        url_results.append({"url":url,"score":risk_score,"features":feats})

    # 3. Keyword Analysis
    text_lower = full_text.lower()
    found_urgency = [w for w in URGENCY_WORDS if w in text_lower]
    found_threats = [w for w in THREAT_WORDS  if w in text_lower]

    # 4. Composite Risk Score
    risk_score = prob_phishing * 60
    risk_score += min(len(suspicious_urls) * 15, 30)
    risk_score += min(len(found_urgency) * 2, 10)
    risk_score = round(min(risk_score, 100), 1)
    risk_level = ("high" if risk_score >= 65 else
                  "medium" if risk_score >= 35 else "low")

    return {
        "prediction":       prediction,
        "confidence":       confidence,
        "risk_score":       risk_score,
        "risk_level":       risk_level,
        "suspicious_urls":  suspicious_urls,
        "flagged_keywords": found_urgency + found_threats,
        "url_analysis":     url_results,
    }