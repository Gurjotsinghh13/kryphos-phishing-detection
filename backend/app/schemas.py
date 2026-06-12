# backend/app/schemas.py

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: Optional[str] = Field(default="", max_length=120)


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class AnalyzeRequest(BaseModel):
    subject: str = Field(default="", max_length=500)
    body: str = Field(default="", max_length=20000)
    urls: List[str] = Field(default_factory=list, max_length=25)

    @field_validator("urls")
    @classmethod
    def validate_urls(cls, urls: List[str]) -> List[str]:
        cleaned = []
        for url in urls:
            if not isinstance(url, str):
                continue
            value = url.strip()
            if not value:
                continue
            if len(value) > 2048:
                raise ValueError("URLs must be 2048 characters or fewer")
            cleaned.append(value)
        return cleaned

    @field_validator("body")
    @classmethod
    def require_email_content(cls, body: str, info):
        subject = info.data.get("subject", "")
        if not subject.strip() and not body.strip():
            raise ValueError("Subject or body is required")
        return body


class URLResult(BaseModel):
    url: str
    score: float
    features: dict


class AnalyzeResponse(BaseModel):
    prediction: str
    confidence: float
    risk_score: float
    risk_level: str
    model_source: str
    flagged_keywords: List[str]
    suspicious_urls: List[dict]
    url_analysis: List[dict]
    prob_phishing: float
    scan_id: Optional[int] = None


class FeedbackRequest(BaseModel):
    scan_id: int = Field(gt=0)
    true_label: int = Field(ge=0, le=1)
    comment: Optional[str] = Field(default="", max_length=1000)


class ScanHistoryItem(BaseModel):
    id: int
    subject: str
    prediction: str
    confidence: float
    risk_level: str
    risk_score: float
    confirmed_label: Optional[int] = None
    created_at: str


class FeedbackResponse(BaseModel):
    message: str
    retrain_triggered: bool
