# backend/app/main.py

import sys
import os
import pickle
import logging
from typing import List

# Fix import paths
BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

sys.path.insert(
    0,
    os.path.join(BASE_DIR, "..")
)

sys.path.insert(
    0,
    os.path.join(BASE_DIR, "..", "ml")
)

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    BackgroundTasks,
    status,
)

from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import StreamingResponse

from contextlib import asynccontextmanager

from io import BytesIO

from app.database import (
    engine,
    Base,
    get_db,
)

from app.auth import (
    router as auth_router,
    get_current_user,
    require_admin,
)

from app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    FeedbackRequest,
    FeedbackResponse,
    ScanHistoryItem,
)

from app.analyzer import analyze_email

from app.models import (
    ScanRecord,
    FeedbackRecord,
)

from app.report import generate_pdf_report

from ml.learner import (
    partial_fit_one,
    batch_retrain_from_feedback,
    get_feedback_count,
    RETRAIN_EVERY,
)

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("Initializing database and ML model")

    Base.metadata.create_all(bind=engine)

    model_path = os.path.join(
        BASE_DIR,
        "..",
        "ml",
        "models",
        "best_model.pkl"
    )

    if not os.path.exists(model_path):
        raise RuntimeError(f"Model file not found: {model_path}")

    with open(model_path, "rb") as model_file:
        app.state.model = pickle.load(model_file)

    logger.info("Model loaded successfully from %s", model_path)

    yield

    logger.info("Shutting down server")


# FastAPI app
app = FastAPI(

    title="Kryphos AI",

    version="2.0.0",

    lifespan=lifespan
)

def _cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS")
    if configured:
        return [origin.strip().rstrip("/") for origin in configured.split(",") if origin.strip()]
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://kryphos-phishing-detection.vercel.app",
    ]


# CORS
app.add_middleware(

    CORSMiddleware,

    allow_origins=_cors_origins(),

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]

)

# Auth routes
app.include_router(

    auth_router,

    prefix="/auth",

    tags=["Auth"]
)


# =====================================================
# Analyze Email
# =====================================================

@app.post(
    "/analyze",
    response_model=AnalyzeResponse
)

async def analyze(

    req: AnalyzeRequest,

    current_user=Depends(
        get_current_user
    ),

    db=Depends(get_db)
):
    try:
        result = analyze_email(
            req.subject,
            req.body,
            req.urls,
            app.state.model
        )
    except Exception as exc:
        logger.exception("Email analysis failed for user_id=%s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email analysis failed",
        ) from exc

    record = ScanRecord(

        user_id=current_user.id,

        subject=req.subject[:200],

        body=req.body[:5000],

        urls=",".join(req.urls or []),

        prediction=result["prediction"],

        confidence=result["confidence"],

        risk_level=result["risk_level"],

        risk_score=result["risk_score"],
    )

    db.add(record)

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to save scan for user_id=%s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save scan",
        ) from exc

    db.refresh(record)

    result["scan_id"] = record.id

    return result


# =====================================================
# Feedback
# =====================================================

@app.post(
    "/feedback",
    response_model=FeedbackResponse
)

async def submit_feedback(

    req: FeedbackRequest,

    background_tasks: BackgroundTasks,

    current_user=Depends(
        get_current_user
    ),

    db=Depends(get_db)
):

    scan = db.query(
        ScanRecord
    ).filter(

        ScanRecord.id == req.scan_id,

        ScanRecord.user_id == current_user.id

    ).first()

    if not scan:

        raise HTTPException(
            404,
            "Scan not found"
        )

    fb = FeedbackRecord(

        scan_id=req.scan_id,

        user_id=current_user.id,

        true_label=req.true_label,

        comment=req.comment or "",
    )

    db.add(fb)
    scan.confirmed_label = req.true_label
    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to save feedback for scan_id=%s", req.scan_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save feedback",
        ) from exc

    full_text = f"{scan.subject} {scan.body}"

    background_tasks.add_task(

        partial_fit_one,

        full_text,

        req.true_label
    )

    count = get_feedback_count() + 1

    if count % RETRAIN_EVERY == 0:

        background_tasks.add_task(
            batch_retrain_from_feedback
        )

        return FeedbackResponse(

            message=f"Thank you! Model is retraining with {count} samples.",

            retrain_triggered=True
        )

    return FeedbackResponse(

        message="Feedback recorded. Model updated instantly.",

        retrain_triggered=False
    )


# =====================================================
# Dashboard
# =====================================================

@app.get("/dashboard")

async def dashboard(

    current_user=Depends(
        get_current_user
    ),

    db=Depends(get_db)
):

    scans = (
        db.query(ScanRecord)
        .filter(ScanRecord.user_id == current_user.id)
        .order_by(ScanRecord.created_at.desc())
        .all()
    )

    fb_count = (
        db.query(FeedbackRecord)
        .filter(FeedbackRecord.user_id == current_user.id)
        .count()
    )

    return {

        "total":
            len(scans),

        "phishing":
            sum(
                1 for s in scans
                if s.prediction == "phishing"
            ),

        "legitimate":
            sum(
                1 for s in scans
                if s.prediction == "legitimate"
            ),

        "feedback_submitted":
            fb_count,

        "recent": [s.to_dict() for s in scans[:5]]
    }


# =====================================================
# History
# =====================================================

@app.get(
    "/history",
    response_model=List[ScanHistoryItem],
)
async def history(
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    scans = (
        db.query(ScanRecord)
        .filter(ScanRecord.user_id == current_user.id)
        .order_by(ScanRecord.created_at.desc())
        .all()
    )
    return [scan.to_dict() for scan in scans]


# =====================================================
# Manual Retrain
# =====================================================

@app.post("/admin/retrain")

async def manual_retrain(

    background_tasks: BackgroundTasks,

    current_user=Depends(
        require_admin
    )
):

    background_tasks.add_task(
        batch_retrain_from_feedback
    )

    return {
        "message":
            "Full retrain started in background"
    }


# =====================================================
# PDF Report
# =====================================================

@app.post("/report/pdf")

async def download_report(

    req: AnalyzeRequest,

    current_user=Depends(
        get_current_user
    )
):
    try:
        result = analyze_email(
            req.subject,
            req.body,
            req.urls,
            app.state.model
        )
    except Exception as exc:
        logger.exception("Report analysis failed for user_id=%s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate report",
        ) from exc

    try:
        pdf = generate_pdf_report(
            result,
            req.subject,
            current_user.email
        )
    except Exception as exc:
        logger.exception("PDF generation failed for user_id=%s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate report",
        ) from exc

    return StreamingResponse(

        BytesIO(pdf),

        media_type="application/pdf",

        headers={

            "Content-Disposition":
                'attachment; filename="report.pdf"'
        }
    )


# =====================================================
# Health Check
# =====================================================

@app.get("/health")

async def health():

    return {

        "status": "ok",

        "feedback_count":
            get_feedback_count()
    }
