@echo off

cd /d C:\Users\OMEN\phishing-detector\backend

call venv\Scripts\activate

uvicorn app.main:app --reload --port 8000

pause