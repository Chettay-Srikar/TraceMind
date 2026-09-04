# SentinelAI

An AI-powered software incident-response agent.

## Purpose

SentinelAI investigates simulated production incidents using logs, metrics, and service-health data. It identifies probable root causes, explains its evidence, recommends remediation, and verifies recovery.

## Current Phase

**Project Initialization** — structure only, no features implemented yet.

## Planned Technology Stack

| Layer     | Technology            |
| --------- | --------------------- |
| Backend   | Python 3.11+, FastAPI |
| Database  | MongoDB Atlas         |
| Data      | Simulated JSON logs   |
| AI        | LLM API (future)     |

## Project Structure

```
SentinelAI/
├── backend/
│   ├── __init__.py        # Package marker
│   ├── main.py            # FastAPI entry point (future)
│   ├── database.py        # MongoDB connection (future)
│   ├── log_streamer.py    # Continuous log streaming (future)
│   ├── analyzer.py        # Analysis engine (future)
│   └── requirements.txt   # Python dependencies
├── data/
│   └── logs.json          # Simulated log data (future)
├── .env                   # Environment variables (not committed)
├── .gitignore
└── README.md
```

## Member 1 Responsibilities

- MongoDB Atlas setup
- Simulated log data
- Continuous log streaming
- FastAPI backend
- Analysis engine
- Anomaly detection
- Health score
- Root-cause analysis
- Recommended actions
