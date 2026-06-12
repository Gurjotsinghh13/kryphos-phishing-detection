# backend/app/url_analyzer.py
import ipaddress
import math
import re
from urllib.parse import urlparse

SUSPICIOUS_TLDS = {".tk", ".ml", ".ga", ".cf", ".gq", ".pw", ".top", ".click", ".xyz"}
SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "ow.ly", "goo.gl", "shorturl.at"}
PHISH_WORDS = [
    "login",
    "signin",
    "verify",
    "secure",
    "account",
    "update",
    "confirm",
    "banking",
    "paypal",
    "ebay",
    "amazon",
    "apple",
    "microsoft",
]


def url_entropy(url: str) -> float:
    """Return Shannon entropy for a URL-like string."""
    if not url:
        return 0.0
    prob = [url.count(char) / len(url) for char in set(url)]
    return -sum(p * math.log2(p) for p in prob if p > 0)


def is_ip_address(hostname: str) -> int:
    try:
        ipaddress.ip_address(hostname)
        return 1
    except ValueError:
        return 0


def extract_url_features(url: str) -> dict:
    """Return a feature dict for a single URL."""
    if not url or not isinstance(url, str):
        return {key: 0 for key in feature_names()}

    normalized = url.strip()
    try:
        parsed = urlparse(normalized if normalized.startswith(("http://", "https://")) else f"http://{normalized}")
    except Exception:
        return {key: 0 for key in feature_names()}

    hostname = (parsed.hostname or "").lower()
    path = parsed.path or ""
    host_parts = [part for part in hostname.split(".") if part]
    tld = f".{host_parts[-1]}" if len(host_parts) > 1 else ""

    return {
        "url_length": len(normalized),
        "dot_count": normalized.count("."),
        "hyphen_count": normalized.count("-"),
        "slash_count": normalized.count("/"),
        "digit_count": sum(char.isdigit() for char in normalized),
        "subdomain_count": max(len(host_parts) - 2, 0),
        "is_https": 1 if parsed.scheme == "https" else 0,
        "is_ip_address": is_ip_address(hostname),
        "is_shortener": 1 if hostname in SHORTENERS else 0,
        "suspicious_tld": 1 if tld in SUSPICIOUS_TLDS else 0,
        "phish_word_count": sum(1 for word in PHISH_WORDS if word in normalized.lower()),
        "special_chars": len(re.findall(r"[@!#$%^&*()]", normalized)),
        "url_entropy": round(url_entropy(normalized), 3),
        "at_symbol": 1 if "@" in normalized else 0,
        "double_slash": 1 if "//" in path else 0,
    }


def feature_names():
    return list(extract_url_features("http://example.com").keys())
