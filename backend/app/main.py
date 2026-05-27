# backend/app/main.py
import sys, os, pickle

# Fix import paths FIRST before any ml imports
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'ml'))

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from io import BytesIO

from app.database import engine, Base, get_db
from app.auth import router as auth_router, get_current_user
from app.schemas import (AnalyzeRequest, AnalyzeResponse,
                          FeedbackRequest, FeedbackResponse)
from app.analyzer import analyze_email
from app.models import ScanRecord, FeedbackRecord
from app.report import generate_pdf_report
from ml.learner import (partial_fit_one, batch_retrain_from_feedback,
                         get_feedback_count, RETRAIN_EVERY)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    app.state.model = pickle.load(open("ml/models/best_model.pkl", "rb"))
    yield

app = FastAPI(title="PhishGuard AI", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(auth_router, prefix="/auth", tags=["Auth"])

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest,
                  current_user=Depends(get_current_user),
                  db=Depends(get_db)):
    result = analyze_email(req.subject, req.body,
                            req.urls, app.state.model)
    record = ScanRecord(
        user_id    = current_user.id,
        subject    = req.subject[:200],
        body       = req.body[:5000],
        urls       = ",".join(req.urls or []),
        prediction = result["prediction"],
        confidence = result["confidence"],
        risk_level = result["risk_level"],
        risk_score = result["risk_score"],
    )
    db.add(record); db.commit(); db.refresh(record)
    result["scan_id"] = record.id
    return result

@app.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(req: FeedbackRequest,
                           background_tasks: BackgroundTasks,
                           current_user=Depends(get_current_user),
                           db=Depends(get_db)):
    scan = db.query(ScanRecord).filter(
        ScanRecord.id == req.scan_id,
        ScanRecord.user_id == current_user.id
    ).first()
    if not scan:
        raise HTTPException(404, "Scan not found")

    fb = FeedbackRecord(
        scan_id    = req.scan_id,
        user_id    = current_user.id,
        true_label = req.true_label,
        comment    = req.comment or "",
    )
    db.add(fb); db.commit()

    scan.confirmed_label = req.true_label
    db.commit()

    full_text = f"{scan.subject} {scan.body}"
    background_tasks.add_task(partial_fit_one, full_text, req.true_label)

    count = get_feedback_count() + 1
    if count % RETRAIN_EVERY == 0:
        background_tasks.add_task(batch_retrain_from_feedback)
        return FeedbackResponse(
            message=f"Thank you! Model is retraining with {count} samples.",
            retrain_triggered=True
        )
    return FeedbackResponse(
        message="Feedback recorded. Model updated instantly.",
        retrain_triggered=False
    )

@app.get("/dashboard")
async def dashboard(current_user=Depends(get_current_user),
                    db=Depends(get_db)):
    scans = db.query(ScanRecord).filter_by(user_id=current_user.id).all()
    fb_count = get_feedback_count()
    return {
        "total":      len(scans),
        "phishing":   sum(1 for s in scans if s.prediction=="phishing"),
        "legitimate": sum(1 for s in scans if s.prediction=="legitimate"),
        "feedback_submitted": fb_count,
        "recent":     [s.to_dict() for s in sorted(
                        scans, key=lambda x: x.created_at, reverse=True)[:5]]
    }

@app.post("/admin/retrain")
async def manual_retrain(background_tasks: BackgroundTasks,
                          current_user=Depends(get_current_user)):
    background_tasks.add_task(batch_retrain_from_feedback)
    return {"message": "Full retrain started in background"}

@app.post("/report/pdf")
async def download_report(req: AnalyzeRequest,
                           current_user=Depends(get_current_user)):
    result = analyze_email(req.subject, req.body,
                            req.urls, app.state.model)
    pdf = generate_pdf_report(result, req.subject, current_user.email)
    return StreamingResponse(BytesIO(pdf), media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="report.pdf"'})

@app.get("/health")
async def health():
    return {"status": "ok", "feedback_count": get_feedback_count()}