# 🧠 Hindsight DevOps Incident Response Agent

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-Next.js-cyan.svg)
![Python](https://img.shields.io/badge/Python-FastAPI-green.svg)

## The Problem
When production goes down at 3 AM, your on-call engineer doesn't have access to the tribal knowledge stored in senior engineers' heads. They waste precious minutes digging through runbooks, past Slack messages, and Jira tickets trying to figure out if this error has happened before.

Downtime costs enterprises an average of $5,600 per minute. A forgetful agent isn't good enough. 

## The Solution
We built an **Incident Response Agent that never forgets**. Using **Hindsight Memory**, this agent acts as a centralized brain for your DevOps team. 
- It parses incoming error logs and stack traces.
- It **Recalls** past incidents, their root causes, and successful resolutions.
- It provides a diagnosis and step-by-step fix using an LLM (Groq + Qwen).
- It **Retains** new knowledge every time an operator clicks "Mark Resolved", forming new mental models so it gets smarter with every outage.

## How Hindsight Memory is Used
Hindsight is the absolute core of this application. Without it, the agent is just a generic LLM wrapper. 

1. **Retain:** When a new incident is resolved, we push the symptoms, error log, root cause, and fix to the `devops-incidents` bank.
2. **Recall:** When a new error occurs, we use Hindsight to semantically search the memory bank for similar past incidents.
3. **Reflect / Mental Models:** Hindsight automatically observes patterns (e.g., "Nginx 502s are usually backend timeouts") and forms mental models that are visible in our dashboard.

## Tech Stack
- **Memory Engine:** Hindsight Cloud SDK
- **LLM:** Groq (`qwen-2.5-32b`)
- **Backend:** Python + FastAPI
- **Frontend:** Next.js + Tailwind CSS (Glassmorphism Dark Mode)

## Setup Instructions

### 1. Clone & API Keys
Create a `.env` file in the `/backend` directory:
```
HINDSIGHT_API_KEY=your_key_here
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
GROQ_API_KEY=your_key_here
```

### 2. Start the Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
```

### 3. Start the Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to interact with the agent!

---
*Built for HackwithHyderabad 3.0*
