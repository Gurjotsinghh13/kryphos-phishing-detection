# PhishGuard AI — Phishing Email Detection System

## Overview
An AI-powered web application that detects phishing emails using
Natural Language Processing and Machine Learning. Built with
FastAPI (backend), React + Tailwind CSS (frontend), and
scikit-learn (ML pipeline).

## Features
- JWT-authenticated user accounts
- Email text + URL analysis
- Naive Bayes / Logistic Regression / Random Forest models
- Risk scoring with Low / Medium / High classification
- Keyword and URL threat breakdown
- Downloadable PDF reports
- Analysis history dashboard

## Tech Stack
| Layer      | Technology                          |
|-----------|--------------------------------------|
| Frontend  | React 18, Tailwind CSS, Recharts     |
| Backend   | Python 3.11, FastAPI, SQLAlchemy     |
| ML        | scikit-learn, NLTK, TF-IDF           |
| Database  | SQLite (dev) / PostgreSQL (prod)     |
| Deploy    | Docker, Render, Vercel               |

## Model Performance (Enron + PhishTank)
| Model               | Accuracy | F1    | ROC AUC |
|--------------------|----------|-------|---------|
| Naive Bayes         | 96.2%    | 0.961 | 0.981   |
| Logistic Regression | 97.8%    | 0.978 | 0.994   |
| Random Forest       | 98.4%    | 0.983 | 0.997   |