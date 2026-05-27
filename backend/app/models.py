# backend/app/models.py  (UPDATED — FeedbackRecord + confirmed_label added)
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name       = Column(String, default="")
    created_at      = Column(DateTime, default=datetime.utcnow)
    scans           = relationship("ScanRecord", back_populates="user")

class ScanRecord(Base):
    __tablename__ = "scan_records"
    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject         = Column(String,  default="")
    body            = Column(Text,    default="")   # NEW: store body for retraining
    urls            = Column(Text,    default="")   # NEW: stored as comma-separated
    prediction      = Column(String,  nullable=False)
    confidence      = Column(Float,   default=0.0)
    risk_level      = Column(String,  default="low")
    risk_score      = Column(Float,   default=0.0)
    confirmed_label = Column(Integer, default=None)  # NEW: set after feedback
    created_at      = Column(DateTime, default=datetime.utcnow)
    user            = relationship("User", back_populates="scans")
    feedback        = relationship("FeedbackRecord", back_populates="scan")

    def to_dict(self):
        return {
            "id":              self.id,
            "subject":         self.subject,
            "prediction":      self.prediction,
            "confidence":      self.confidence,
            "risk_level":      self.risk_level,
            "risk_score":      self.risk_score,
            "confirmed_label": self.confirmed_label,
            "created_at":      self.created_at.isoformat(),
        }

class FeedbackRecord(Base):
    __tablename__ = "feedback_records"
    id         = Column(Integer, primary_key=True, index=True)
    scan_id    = Column(Integer, ForeignKey("scan_records.id"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    true_label = Column(Integer, nullable=False)   # 0 or 1
    comment    = Column(String,  default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    scan       = relationship("ScanRecord", back_populates="feedback")