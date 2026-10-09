# JobOrbit — Autonomous Tech Career Aggregator & AI Career Engine

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-black.svg?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg?style=flat-square)](https://joborbit.live)

**Live Production Domain:** [https://joborbit.live](https://joborbit.live)

</div>

---

## 📌 Overview

**JobOrbit** is an autonomous, full-stack tech career engine that aggregates **13,400+ verified engineering roles, internships, and startup positions** across India and global remote markets.

Unlike traditional job boards filled with expired listings, sponsored spam, or infinite redirect loops, JobOrbit indexes direct ATS links (**Workday, Greenhouse, Lever, Ashby, Taleo**) within an early-access window of **6–8 hours** before public distribution.

---

## ⚡ Core Features

### 1. 🔍 Direct ATS Roles Explorer
* Real-time search across 13,000+ indexed listings.
* Multi-dimensional filtering by region (India Tech vs. Global Remote), opportunity type (Full-Time, Internship), and batch eligibility (2024 / 2025 / 2026 / 2027).
* Direct zero-redirect official portal links and pre-composed recruiter outreach drafts.

### 2. 🤖 AI Audit Agent & Profile Diagnostics
* Autonomous deep-scan evaluation of technical skill density against high-yield tech benchmarks.
* Automated gap detection with personalized recommendations.
* Instant generation of high-converting STAR achievements for engineering resumes.

### 3. 📄 AI Resume Studio
* Instant tech stack parser detecting 60+ frameworks, databases, and agent architectures.
* Jaccard similarity match index scoring against thousands of live job descriptions.
* Tone-controlled cold InMail and recruiter email drafter.

### 4. 👥 Recruiter & Talent Acquisition Directory
* Curated directory of talent acquisition leads and hiring managers.
* Derived verified corporate inboxes and direct LinkedIn profile links.

### 5. 🔄 Autonomous Ingestion Pipeline
* Built-in `APScheduler` background service executing every 3 hours.
* Incremental delta-crawling with consecutive-hit early stopping to eliminate redundant queries.
* Cryptographic SHA-256 deduplication: `hash(title + company + location)`.

### 6. 💳 VIP Early Access Membership
* **₹75 / Month** (with 3-Month ₹215 and 1-Year ₹699 savings options).
* Dual-gateway integration: **Cashfree UPI** for India & **Dodo Payments** ($9.99) for international candidates.

### 7. 🔐 Secure Authentication System
* Email/Password authentication powered by cryptographically salted password hashes.
* One-click Google OAuth 2.0 Web Client integration.
* Protected admin panel guarded by strict token-based authorization (`X-Admin-Token`).

---

## 🏗️ System Architecture

```
               ┌────────────────────────────────────────────────────────┐
               │              Production Edge (joborbit.live)           │
               └───────────────────────────┬────────────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
                    ▼                                             ▼
       ┌────────────────────────┐                    ┌────────────────────────┐
       │    Cloudflare Pages    │                    │     Koyeb Container    │
       │    Frontend (Vite)     │                    │  Python 3.12 / Gunicorn│
       │  React 18 + Tailwind   │                    │     Flask REST API     │
       └────────────────────────┘                    └───────────┬────────────┘
                                                                 │
                                          ┌──────────────────────┼──────────────────────┐
                                          ▼                      ▼                      ▼
                               ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
                               │ SQLite / Postgres │  │    APScheduler    │  │  Google Gemini /  │
                               │  13,444+ Records  │  │  3-Hour Crawler   │  │    Hunter AI      │
                               └───────────────────┘  └───────────────────┘  └───────────────────┘
```

---

## 📁 Repository Structure

```text
joborbit/
├── backend/
│   ├── app.py                      # Flask application factory & WSGI entrypoint
│   ├── gunicorn.conf.py            # High-concurrency production WSGI configuration
│   ├── scheduler.py                # Autonomous APScheduler background runner
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile                  # Multi-stage production container build
│   ├── data/
│   │   └── joborbit.db             # Pre-populated SQLite database (13,444+ jobs)
│   ├── core/
│   │   ├── config.py               # Central settings & environment configurations
│   │   ├── extensions.py           # Database, cache, limiter, and migration instances
│   │   └── auth_guard.py           # Admin token & user authentication decorators
│   ├── models/
│   │   ├── job.py                  # Job opportunity schema & indices
│   │   ├── user.py                 # User authentication & subscription model
│   │   └── hr_contact.py           # Talent acquisition contact entity
│   ├── repositories/               # Encapsulated database access layer
│   ├── routes/
│   │   ├── jobs.py                 # /api/jobs (Search, filters, pagination)
│   │   ├── auth.py                 # /api/auth (Login, Signup, Google OAuth)
│   │   ├── ai.py                   # /api/ai (Audit agent, Resume fit, InMail drafter)
│   │   ├── admin.py                # /api/admin (Ingestion telemetry, CRUD, logs)
│   │   └── premium.py              # /api/premium (Cashfree & Dodo Payments)
│   └── scraper/
│       ├── sync.py                 # Orchestrator & incremental delta crawler
│       ├── parser.py               # Stream & HTML data extractor
│       └── hr_scraper.py           # Talent directory and email finder
│
├── frontend/
│   ├── public/
│   │   └── _redirects              # Cloudflare Pages SPA rewrite rules
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Responsive sticky navigation & auth profile badge
│   │   │   ├── LandingPage.jsx     # High-conversion hero, telemetry, & ₹75/mo pricing
│   │   │   ├── JobsExplorer.jsx    # Real-time searchable job feed
│   │   │   ├── AuthModal.jsx       # Login, Signup, & Google OAuth modal
│   │   │   ├── AuditAgent.jsx      # Technical profile & STAR achievement audit
│   │   │   ├── ResumeStudio.jsx    # ATS resume parser & JD fit analyzer
│   │   │   ├── HRDirectory.jsx     # Recruiter directory with email templates
│   │   │   └── VIPModal.jsx        # Dual-currency payment modal
│   │   ├── App.jsx                 # Client routing & cached telemetry state
│   │   └── index.css               # Design system & responsive styles
│   ├── vite.config.js              # Vite bundler & development proxy
│   └── package.json
│
├── docker-compose.prod.yml         # Full-stack Docker deployment (Nginx + API + Redis)
├── nginx.conf                      # Production reverse proxy & micro-caching
├── .env.example                    # Environment variable template
└── README.md                       # Documentation
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Git

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Start Flask development server
python app.py
```
> Backend runs at: **`http://127.0.0.1:5000`**

### 3. Frontend Setup
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
> Frontend opens at: **`http://127.0.0.1:5173`**

---

## 🛠️ CLI Pipeline Commands

You can run the ingestion pipeline directly via the command line:

```bash
# Quick smoke test (2 pages of India + Global)
python -m scraper.sync --target quick

# Incremental delta crawl (stops when existing jobs are found)
python -m scraper.sync --target all --mode incremental

# Full re-ingestion
python -m scraper.sync --target all --mode full
```

---

## 🌐 Production Deployment Guide

### Option B: Cloudflare Pages (Frontend) + Koyeb (Backend)

#### Step 1: Deploy Frontend on Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > **Workers & Pages** > **Create application** > **Pages**.
2. Connect your repository.
3. Configure settings:
   - **Framework preset**: `Vite`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. Deploy and link your custom domain (`joborbit.live`).

#### Step 2: Deploy Backend on Koyeb
1. Go to [Koyeb](https://koyeb.com) > **Create Service** > **GitHub**.
2. Settings:
   - **Builder**: `Dockerfile` (`backend/Dockerfile`)
   - **Root directory**: `backend`
   - **Instance**: Free Eco (Nano)
3. Add environment variables:
   ```env
   SECRET_KEY=your-production-secret-key
   FLASK_ENV=production
   ADMIN_TOKEN=your-admin-token
   CORS_ORIGINS=https://joborbit.live,https://www.joborbit.live
   ```
4. Deploy and point CNAME `api.joborbit.live` to Koyeb.

---

## 🔑 Environment Variables Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `SECRET_KEY` | Flask session & cryptographic signature key | `joborbit-prod-secret-2026` |
| `DATABASE_URL` | Database connection URI | `sqlite:///data/joborbit.db` |
| `ADMIN_TOKEN` | Secret header required for `/api/admin/*` | `your-admin-secret-token` |
| `CORS_ORIGINS` | Permitted cross-origin domains | `https://joborbit.live,http://localhost:5173` |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | `xxxx.apps.googleusercontent.com` |
| `GEMINI_API_KEY` | Google Gemini 2.5 LLM API key | `AIzaSy...` |
| `SYNC_INTERVAL_HOURS` | APScheduler background sync interval | `3` |

---

## 📡 API Reference Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status |
| `GET` | `/api/jobs` | Paginated and filtered job search |
| `GET` | `/api/jobs/<id>` | Full opportunity metadata & ATS link |
| `POST` | `/api/auth/signup` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate user & issue token |
| `POST` | `/api/auth/google` | Verify Google OAuth credentials |
| `POST` | `/api/ai/audit-agent` | Profile evaluation & STAR achievements |
| `POST` | `/api/ai/fit-check` | JD similarity & missing skills analyzer |
| `GET` | `/api/hr` | Recruiter contact directory |
| `POST` | `/api/admin/sync` | Trigger crawler (`quick`, `india`, `all`) |
| `GET` | `/api/admin/sync/status` | Live ingestion status & progress |
| `GET` | `/api/admin/stats` | System telemetry & database metrics |

---

## 📄 License

JobOrbit is released under the **MIT License**. Copyright © 2026 [JobOrbit Inc.](https://joborbit.live)
