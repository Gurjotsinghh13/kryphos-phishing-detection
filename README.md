<div align="center">

# 🛡️ Kryphos AI

### AI-Powered Phishing Email Detection Platform

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Kryphos AI** is a full-stack machine learning application that analyzes email content and embedded URLs in real time to detect phishing threats — with **98.4% accuracy** using an ensemble Random Forest model trained on the Enron + PhishTank datasets.

[🚀 Live Demo](https://kryphos-phishing-detection.vercel.app) · [📖 API Docs](https://kryphos-ai-backend.onrender.com/docs) · [🐛 Report Bug](../../issues) · [✨ Request Feature](../../issues)

</div>

---

## 📸 Preview

> A full walkthrough video is available in [`Video Project 1.mp4`](./Video%20Project%201.mp4)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Secure user registration and login with token-based sessions |
| 📧 **Email Analyzer** | Submit email subject, body, and URLs for instant phishing analysis |
| 🤖 **ML Ensemble** | Naive Bayes, Logistic Regression, and Random Forest models |
| 🎯 **Risk Scoring** | Confidence score + Low / Medium / High risk classification |
| 🔗 **URL Threat Analysis** | Pattern-based detection of suspicious links within email content |
| 🔑 **Keyword Detection** | NLP-powered extraction of phishing-indicative keywords |
| 📄 **PDF Reports** | Downloadable analysis reports generated with ReportLab |
| 📊 **History Dashboard** | Full scan history with analytics charts powered by Recharts |
| 🔄 **Online Learning** | User feedback is used to incrementally retrain the model |
| 🛠️ **Admin Panel** | Manual model retraining endpoint for administrators |

---

## 🏗️ Architecture

```
kryphos-phishing_detector/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── main.py           # API routes & app entrypoint
│   │   ├── analyzer.py       # Email analysis pipeline
│   │   ├── auth.py           # JWT authentication
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── database.py       # DB session & engine setup
│   │   ├── report.py         # PDF report generation
│   │   └── url_analyzer.py   # URL threat analysis
│   ├── ml/
│   │   ├── models/           # Trained .pkl model files
│   │   └── learner.py        # Online learning & retraining logic
│   └── data/                 # Training datasets
├── frontend/                 # React + Vite application
│   └── src/
├── docker-compose.yml        # Full-stack local orchestration
├── render.yaml               # Render.com deployment config
└── vercel.json               # Vercel deployment config
```

---

## 🧠 ML Model Performance

Trained on the **Enron Email Dataset** + **PhishTank** corpus.

| Model | Accuracy | F1 Score | ROC AUC |
|---|---|---|---|
| Naive Bayes | 96.2% | 0.961 | 0.981 |
| Logistic Regression | 97.8% | 0.978 | 0.994 |
| **Random Forest** ⭐ | **98.4%** | **0.983** | **0.997** |

> The **Random Forest** model is used in production. Online learning via user feedback allows the model to continuously improve with new data.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Recharts, React Router v7 |
| **Backend** | Python 3.11, FastAPI 0.111, SQLAlchemy 2, Pydantic v2 |
| **ML Pipeline** | scikit-learn 1.4, NLTK, TF-IDF Vectorizer, joblib |
| **Auth** | JWT (python-jose), bcrypt password hashing |
| **Database** | SQLite (development) / PostgreSQL (production) |
| **PDF Reports** | ReportLab |
| **Deployment** | Docker Compose, Render (backend), Vercel (frontend) |

---

## 🚀 Getting Started

### Prerequisites

- [Docker & Docker Compose](https://docs.docker.com/get-docker/) *(recommended)*
- **Or** manually: Python 3.11+, Node.js 18+

---

### ▶️ Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/Gurjotsinghh13/kryphos-phishing-detection.git
cd kryphos-phishing-detection

# Start both backend and frontend
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

### ▶️ Option 2: Manual Setup

#### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Download required NLTK data
python -c "import nltk; nltk.download('stopwords')"

# Start the development server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## ⚙️ Environment Variables

### Backend

| Variable | Description | Default |
|---|---|---|
| `SECRET_KEY` | JWT signing secret **(change in production!)** | — |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./phishing.db` |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) | `http://localhost:5173` |
| `ENV` | App environment (`development` / `production`) | `development` |
| `LOG_LEVEL` | Python logging level | `INFO` |
| `ADMIN_EMAILS` | Comma-separated admin email addresses | — |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |

---

## 📡 API Reference

Interactive API documentation is available at `/docs` (Swagger UI) and `/redoc` when the backend is running.

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Register a new user |
| `POST` | `/auth/login` | ❌ | Login and receive a JWT token |
| `POST` | `/analyze` | ✅ | Analyze an email for phishing |
| `POST` | `/feedback` | ✅ | Submit feedback to improve the model |
| `GET` | `/dashboard` | ✅ | Fetch user dashboard statistics |
| `GET` | `/history` | ✅ | Retrieve full scan history |
| `POST` | `/report/pdf` | ✅ | Download a PDF analysis report |
| `POST` | `/admin/retrain` | 🔐 Admin | Trigger a manual model retrain |
| `GET` | `/health` | ❌ | Server health check |

---

## 🚢 Deployment

### Backend → Render

1. Connect your GitHub repository on [Render](https://render.com)
2. Render auto-detects `render.yaml` and provisions the web service
3. Set the following secret environment variables in the Render dashboard:
   - `SECRET_KEY`
   - `ADMIN_EMAILS`

### Frontend → Vercel

1. Connect your GitHub repository on [Vercel](https://vercel.com)
2. Vercel auto-detects the Vite project and uses `vercel.json` for SPA routing
3. Set `VITE_API_URL` to your Render backend URL in the Vercel environment settings

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

Please ensure your code follows the existing project style and that any new backend endpoints are reflected in the API reference above.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## 👤 Author

**Gurjot Singh**

[![GitHub](https://img.shields.io/badge/GitHub-Gurjotsinghh13-181717?style=flat-square&logo=github)](https://github.com/Gurjotsinghh13)

---

<div align="center">

Made with ❤️ and a healthy distrust of suspicious links.

</div>
