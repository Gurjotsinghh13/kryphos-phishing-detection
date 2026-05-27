# backend/app/url_analyzer.py
import re, math
from urllib.parse import urlparse

SUSPICIOUS_TLDS = {'.tk','.ml','.ga','.cf','.gq','.pw','.top','.click','.xyz'}
SHORTENERS = {'bit.ly','tinyurl.com','t.co','ow.ly','goo.gl','shorturl.at'}
PHISH_WORDS = ['login','signin','verify','secure','account','update','confirm',
               'banking','paypal','ebay','amazon','apple','microsoft']

def url_entropy(url: str) -> float:
    """Shannon entropy — high entropy → obfuscated URL."""
    prob = [url.count(c)/len(url) for c in set(url)]
    return -sum(p*math.log2(p) for p in prob if p > 0)

def extract_url_features(url: str) -> dict:
    """Return a feature dict for a single URL."""
    if not url or not isinstance(url, str):
        return {k: 0 for k in feature_names()}
    try:
        parsed = urlparse(url if url.startswith('http') else 'http://'+url)
    except Exception:
        return {k: 0 for k in feature_names()}

    hostname = parsed.hostname or ""
    path     = parsed.path or ""
    tld      = '.' + hostname.split('.')[-1] if '.' in hostname else ''

    return {
        "url_length":       len(url),
        "dot_count":        url.count('.'),
        "hyphen_count":     url.count('-'),
        "slash_count":      url.count('/'),
        "digit_count":      sum(c.isdigit() for c in url),
        "subdomain_count":  len(hostname.split('.')) - 2 if hostname else 0,
        "is_https":         1 if parsed.scheme == 'https' else 0,
        "is_ip_address":    1 if re.match(r'^(d{1,3}.){3}d{1,3}$', hostname) else 0,
        "is_shortener":     1 if hostname in SHORTENERS else 0,
        "suspicious_tld":   1 if tld in SUSPICIOUS_TLDS else 0,
        "phish_word_count": sum(1 for w in PHISH_WORDS if w in url.lower()),
        "special_chars":    len(re.findall(r'[@!#$%^&*()]', url)),
        "url_entropy":      round(url_entropy(url), 3),
        "at_symbol":        1 if '@' in url else 0,
        "double_slash":     1 if '//' in path else 0,
    }

def feature_names():
    return list(extract_url_features("http://example.com").keys())