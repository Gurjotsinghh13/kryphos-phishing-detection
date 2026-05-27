# backend/app/schemas.py

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = ""


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class AnalyzeRequest(BaseModel):
    subject: str
    body: str
    urls: Optional[List[str]] = []


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
    scan_id: Optional[int] = None


class FeedbackRequest(BaseModel):
    scan_id: int
    true_label: int
    comment: Optional[str] = ""


class FeedbackResponse(BaseModel):
    message: str
    retrain_triggered: bool