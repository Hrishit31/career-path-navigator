# 🎯 Career Path Navigator

> An intelligent career counseling and mental health tracking platform powered by machine learning and NLP sentiment analysis.

![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-black?style=flat-square&logo=flask)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4-orange?style=flat-square&logo=scikit-learn)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow?style=flat-square&logo=javascript)
![SQLite](https://img.shields.io/badge/SQLite-3-blue?style=flat-square&logo=sqlite)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)

---

## 📌 Overview

Career Path Navigator is a full-stack web application that bridges the gap between career counseling and mental health tracking. Unlike traditional aptitude platforms, it combines three ML models with NLP-based sentiment analysis to provide **stress-aware, personalized career recommendations**.

The platform goes beyond simple job matching — it reads your emotional state through journal entries, detects stress and burnout using NLP, and adjusts career recommendations accordingly through a unique **Fusion Layer**. If you are stressed, it prioritizes lower-pressure careers. If you are motivated and positive, it unlocks ambitious paths.

Built as a Final Year Major Project at KIET Group of Institutions, Delhi-NCR, Ghaziabad.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧠 **ML Career Prediction** | Ensemble of SVM, Decision Tree and Gradient Boosting with 92%+ accuracy across 10 career paths |
| 💬 **NLP Sentiment Analysis** | Rule-based sentiment engine detects stress, burnout, and motivation from journal entries |
| ⚡ **Fusion Layer** | Combines career scores with mental state for stress-aware, adaptive recommendations |
| 📊 **Skill Gap Radar** | Spider/radar chart comparing your current profile vs the ideal profile for any target career |
| 🔍 **Career Explorer** | Detailed profiles for 10 careers with salary ranges, top companies, education paths, and roadmaps |
| 📈 **Job Market Data** | Job counts, growth trends, and top hiring cities for every career path |
| 📚 **Course Recommendations** | Curated free and paid courses from Coursera, NPTEL, Udemy, and edX based on skill gaps |
| ⚖️ **Career Comparison** | Side-by-side comparison of any two careers with salary bar chart |
| ❤️ **Daily Check-in** | Mood and energy tracking with 28-day calendar heatmap |
| 🎯 **Career Quiz** | 10-question personality quiz for quick career match without sliders |
| 📧 **Email OTP Login** | Secure authentication via 6-digit OTP — dev mode shows OTP on screen |
| 📄 **PDF Export** | Download full career analysis report using jsPDF |
| 🌙 **Dark / Light Mode** | System preference detection with smooth transitions and persistent storage |
| 🗺️ **Roadmap Builder** | Drag-and-drop career planning tool |
| 💬 **AI Career Guide** | Simulated chat interface for career guidance |
| 🕐 **History Tracking** | All past recommendation sessions saved per user |

---

## 🛠️ Tech Stack

### Backend
- **Python 3.11** — Core language
- **Flask** — Lightweight REST API framework
- **scikit-learn** — SVM, Decision Tree, Gradient Boosting models
- **pandas / numpy** — Data processing and feature engineering
- **SQLite** — User data, recommendation history, and daily check-ins
- **Flask-Mail** — OTP email delivery (optional, Gmail SMTP)

### Frontend
- **HTML5 / CSS3 / Vanilla JavaScript** — No React, no frameworks
- **Chart.js** — Data visualizations (bar, radar, line, doughnut charts)
- **jsPDF** — Client-side PDF report generation
- **Syne + Outfit** — Google Fonts typography
- **CSS Variables** — Full dark and light mode theming

### ML Pipeline

```
User Input (15 features)
        ↓
Feature Scaling (StandardScaler)
        ↓
┌─────────────────────────────────────┐
│  SVM  │  Decision Tree  │  GBM/XGB  │
└─────────────────────────────────────┘
        ↓
Probability Averaging (Ensemble)
        ↓
Career Recommendations (Top 3)
        ↓
NLP Sentiment Analysis (Rule-based)
        ↓
Fusion Layer (Stress-Aware Ranking)
        ↓
Final Recommendations + Advisory Message
```

---

## 📁 Project Structure

```
career-path-navigator/
│
├── backend/
│   ├── app.py                    ← Flask entry point, CORS, blueprints
│   ├── requirements.txt          ← Python dependencies
│   ├── career_navigator.db       ← SQLite database (auto-created)
│   ├── models/                   ← Trained ML model pickle files
│   │   ├── svm.pkl
│   │   ├── decision_tree.pkl
│   │   ├── xgboost.pkl
│   │   ├── scaler.pkl
│   │   ├── label_encoder.pkl
│   │   └── feature_cols.pkl
│   ├── routes/
│   │   ├── auth.py               ← Signup, login, logout, OTP endpoints
│   │   ├── predict.py            ← Career prediction and sentiment endpoints
│   │   └── features.py           ← Career profiles, skill gap, quiz, check-in
│   └── utils/
│       ├── db.py                 ← SQLite helpers, table init
│       ├── ml_utils.py           ← ML model loading and inference
│       ├── nlp_utils.py          ← Rule-based sentiment analysis
│       ├── fusion.py             ← Career + mental health fusion logic
│       ├── otp.py                ← OTP generation and verification
│       └── career_data.py        ← Career profiles data and quiz questions
│
├── frontend/
│   ├── index.html                ← Single page application (all 12 sections)
│   ├── styles.css                ← Noir Cosmos dark theme, full responsive
│   └── script.js                 ← All frontend logic (1000+ lines)
│
├── dataset/
│   ├── generate_dataset.py       ← Synthetic dataset generator (1000 rows)
│   └── career_dataset.csv        ← Generated training dataset
│
├── train_models.py               ← Model training script
├── LICENSE                       ← MIT License
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- pip
- VS Code with Live Server extension (recommended for frontend)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Hrishit31/career-path-navigator.git
cd career-path-navigator
```

**2. Install Python dependencies**

```bash
pip install flask scikit-learn pandas numpy
```

**3. Generate dataset and train models**

```bash
python dataset/generate_dataset.py
python train_models.py
```

Expected output:
```
Dataset saved: dataset/career_dataset.csv  (1000 rows)
svm:            92.50%
decision_tree:  91.50%
xgboost:        92.50%
Models saved to backend/models/
```

**4. Start the backend server**

```bash
cd backend
python app.py
```

Server starts at: `http://127.0.0.1:5000`

You should see:
```
* Running on http://127.0.0.1:5000
* Running on http://192.168.x.x:5000
```

**5. Open the frontend**

Open `frontend/index.html` with VS Code Live Server.

Right-click `index.html` → Open with Live Server → Opens at `http://127.0.0.1:5500`

**Both the backend (port 5000) and frontend (port 5500) must be running at the same time.**

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signup` | Register a new user account |
| POST | `/api/login` | Login with username and password |
| POST | `/api/logout` | End the current session |
| GET | `/api/me` | Get current session info |
| POST | `/api/send-otp` | Send OTP to email address |
| POST | `/api/verify-otp` | Verify OTP and create session |

### ML & Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predict-career` | Run ML career prediction only |
| POST | `/api/analyze-sentiment` | Run NLP sentiment analysis only |
| POST | `/api/get-recommendation` | Full pipeline — ML + NLP + Fusion |
| GET | `/api/history` | Get saved recommendation history |

### Career Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/careers` | Get all career summaries |
| GET | `/api/career-profile/<name>` | Get detailed career profile |
| POST | `/api/skill-gap` | Get skill gap analysis and radar data |
| POST | `/api/compare-careers` | Compare two careers side by side |
| GET | `/api/quiz-questions` | Get all 10 quiz questions |
| POST | `/api/quiz-result` | Calculate quiz result from answers |
| GET | `/api/job-market` | Get job market data for all careers |

### Check-ins

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/daily-checkin` | Save today's mood and energy check-in |
| GET | `/api/get-checkins` | Get check-in history (last 30 days) |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

---

## 🧠 ML Models

### Input Features (15 total)

| Category | Features |
|----------|----------|
| Academic Performance | Mathematics, Science, English, Arts, Commerce |
| Skills | Coding, Communication, Creativity, Analytical Thinking, Leadership |
| Interests | Technology, Science, Arts, Business |
| Psychometric | Stress Tolerance |

### Career Labels (10 classes)

```
Software Engineer  ·  Data Scientist  ·  Doctor  ·  Lawyer  ·  Graphic Designer
Mechanical Engineer  ·  Teacher  ·  Accountant  ·  Psychologist  ·  Entrepreneur
```

### Model Performance

| Model | Accuracy |
|-------|----------|
| SVM (RBF kernel, C=10) | 92.5% |
| Decision Tree (max_depth=12) | 91.5% |
| Gradient Boosting (n=150) | 92.5% |
| **Ensemble Average** | **~93%** |

All three models are trained on a synthetic dataset of 1000 samples generated to reflect realistic career-feature correlations. Predictions are averaged across all three models for a more robust result.

---

## ⚡ Fusion Layer Logic

The Fusion Layer is the core innovation of this project. It combines career suitability scores with NLP-detected mental health indicators to produce adaptive, stress-aware recommendations.

```python
if stress_level == HIGH:
    boost low-pressure careers   (+12 points)
    penalise high-pressure ones  (-10 points)

elif stress_level == MEDIUM:
    slight boost to calm careers (+5 points)

elif stress_level == LOW and polarity > 0.2:
    boost ambitious careers      (+8 points)
```

Low-pressure careers: Teacher, Graphic Designer, Psychologist, Accountant, Lawyer

High-pressure careers: Software Engineer, Data Scientist, Entrepreneur, Doctor, Mechanical Engineer

---

## 🔒 Authentication

Two login methods are supported:

### 1. Username and Password
- Passwords hashed with SHA-256 (stdlib, no external dependency)
- Server-side Flask sessions
- localStorage fallback for `file://` access

### 2. Email OTP
- 6-digit random OTP with 5-minute expiry
- Single-use — deleted after successful verification
- **Dev mode:** OTP displayed on screen (no email setup needed)
- **Production mode:** Gmail SMTP via Flask-Mail

### Enabling Real Gmail OTP

```python
# In backend/app.py, uncomment this block:
from flask_mail import Mail
app.config["MAIL_SERVER"]   = "smtp.gmail.com"
app.config["MAIL_PORT"]     = 587
app.config["MAIL_USE_TLS"]  = True
app.config["MAIL_USERNAME"] = "your@gmail.com"
app.config["MAIL_PASSWORD"] = "your-16-char-app-password"
mail = Mail(app)
```

Generate your Gmail App Password at: https://myaccount.google.com/apppasswords

Then install Flask-Mail:
```bash
pip install flask-mail
```

---

## 📖 Research Background

This project is based on the research paper:

> **Career Path Navigator: Integrating Career Counseling and Mental Health Tracking**
> Madhur Tyagi, Urvashi, Hrishit Bhardwaj, Nakul Sonkar, Madhukar Yadav
> KIET Group of Institutions, Delhi-NCR, Ghaziabad, India

### Key References

- Chen, T. and Guestrin, C. (2016). XGBoost: A Scalable Tree Boosting System. KDD 2016.
- Hutto, C.J. and Gilbert, E. (2014). VADER: A Parsimonious Rule-Based Model for Sentiment Analysis. ICWSM 2014.
- Devlin, J. et al. (2019). BERT: Pre-training of Deep Bidirectional Transformers. NAACL 2019.
- Vaswani, A. et al. (2017). Attention Is All You Need. NeurIPS 2017.

---

## 🤝 Contributing

Contributions are welcome. For major changes, please open an issue first to discuss what you would like to change.

```bash
# Fork the repository
# Create your feature branch
git checkout -b feature/NewFeature

# Make your changes and commit
git commit -m "Add NewFeature"

# Push to your branch
git push origin feature/NewFeature

# Open a Pull Request on GitHub
```

---

## 👥 Authors

| Name | Role | Email |
|------|------|-------|
| **Hrishit Bhardwaj** | Developer | hrishit.2226csit1039@kiet.edu |
| **Madhur Tyagi** | Developer | madhur.2226csit1030@kiet.edu |
| **Urvashi** | Developer | urvashi.2226csit1135@kiet.edu |
| **Nakul Sonkar** | Developer | nakul.2226csit1169@kiet.edu |
| **Madhukar Yadav** | Project Supervisor | madhukar.csit@kiet.edu |

**Institution:** KIET Group of Institutions, Delhi-NCR, Ghaziabad, India

---

## ⭐ Support

If this project helped you, please give it a ⭐ on GitHub!

For issues or questions, open a GitHub Issue or contact any of the authors above.

---

*Built with ❤️ at KIET Group of Institutions, Delhi-NCR — 2026*
