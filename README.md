# TraceMind

An AI-powered software incident-response agent.

## Purpose

TraceMind investigates simulated production incidents using logs, metrics, and service-health data. It identifies probable root causes, explains its evidence, recommends remediation, and verifies recovery.

## Current Phase

**Step 5** — Implemented Recommendation Engine.

## Planned Technology Stack

| Layer     | Technology            |
| --------- | --------------------- |
| Backend   | Python 3.11+, FastAPI |
| Database  | MongoDB Atlas         |
| Data      | Simulated JSON logs   |
| AI        | LLM API (future)     |

## Project Structure

```
TraceMind/
├── backend/
│   ├── __init__.py                # Package marker
│   ├── main.py                    # FastAPI entry point
│   ├── analyzer.py                # Analysis engine
│   ├── correlation_engine.py      # Incident progression and correlation
│   ├── ai_investigator.py         # AI Investigation layer
│   ├── solution_intelligence.py   # Solution Intelligence layer
│   ├── recommendation_engine.py   # Deterministic Ranking layer
│   ├── featherless_client.py      # Featherless AI client
│   ├── test_correlation_engine.py # Tests for correlation engine
│   ├── test_ai_investigator.py    # Tests for AI investigator
│   ├── test_solution_intelligence.py # Tests for Solution Intelligence
│   ├── test_recommendation_engine.py # Tests for Recommendation Engine
│   ├── telemetry_generator.py     # Log and Metric generator
│   ├── test_telemetry_generator.py # Tests for generator
│   └── requirements.txt           # Python dependencies
├── data/
│   └── logs.json          # Simulated log data (future)
├── .env                   # Environment variables (not committed)
├── .gitignore
└── README.md
```

## Running the Telemetry Generator

To generate a new batch of simulated incidents and telemetry, run:

```bash
python -m backend.telemetry_generator
```

This will output the deterministic generated scenarios to `data/logs.json`.

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
