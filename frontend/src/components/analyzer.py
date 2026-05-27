# backend/app/analyzer.py  (UPDATED — uses blended pipeline)
import re
from app.url_analyzer import extract_url_features, PHISH_WORDS
from ml.preprocessing import extract_phishing_features, URGENCY_WORDS, THREAT_WORDS
from ml.pipeline import predict_blended

def analyze_email(subject: str, body: str,
                  urls: list[str], base_model) -> dict:
    full_text = f"{subject} {body}"

    # 1. Blended ML prediction (base + online model)
    prob_phishing, model_source = predict_blended(full_text, base_model)
    prediction = "phishing" if prob_phishing > 0.5 else "legitimate"
    confidence = round(max(prob_phishing, 1 - prob_phishing) * 100, 1)

    # 2. URL analysis
    url_results, suspicious_urls = [], []
    for url in (urls or []):
        feats = extract_url_features(url)
        score = (
            feats["is_ip_address"]    * 30 +
            feats["suspicious_tld"]   * 25 +
            feats["phish_word_count"] * 10 +
            feats["is_shortener"]     * 20 +
            (1 - feats["is_https"])   * 15 +
            min(feats["subdomain_count"] * 5, 20)
        )
        entry = {"url": url, "score": round(score,1), "features": feats}
        url_results.append(entry)
        if score >= 30:
            suspicious_urls.append(entry)

    # 3. Keyword analysis
    text_lower = full_text.lower()
    found_urgency = [w for w in URGENCY_WORDS if w in text_lower]
    found_threats = [w for w in THREAT_WORDS  if w in text_lower]

    # 4. Composite risk score
    risk = prob_phishing * 60
    risk += min(len(suspicious_urls) * 15, 30)
    risk += min(len(found_urgency) * 2, 10)
    risk = round(min(risk, 100), 1)
    risk_level = "high" if risk >= 65 else "medium" if risk >= 35 else "low"

    return {
        "prediction":       prediction,
        "confidence":       confidence,
        "risk_score":       risk,
        "risk_level":       risk_level,
        "model_source":     model_source,
        "suspicious_urls":  suspicious_urls,
        "flagged_keywords": list(set(found_urgency + found_threats)),
        "url_analysis":     url_results,
        "prob_phishing":    prob_phishing,
    }