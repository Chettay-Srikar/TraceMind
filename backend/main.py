"""
TraceMind — FastAPI Entry Point

Provides REST API endpoints to access simulated logs stored in MongoDB.
"""

from typing import List, Optional
import csv
import json
import io
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Depends
from backend.auth import get_current_user
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import PyMongoError
from pydantic import BaseModel

from backend.database import get_logs_collection, test_connection
from backend.analyzer import analyze_logs
from backend.ai_investigator import investigate_incident
from backend.solution_intelligence import generate_solutions
from backend.recommendation_engine import rank_solutions
from backend.remediation_engine import execute_remediation
from backend.recovery_verification import verify_recovery
import os

app = FastAPI(title="TraceMind API", description="AI-powered software incident-response agent API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def serialize_mongo_doc(doc: dict) -> dict:
    """Helper to convert MongoDB ObjectId to string for JSON serialization."""
    if not doc:
        return doc
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


@app.post("/logs/import")
async def import_logs(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    content = await file.read()
    filename = file.filename.lower()
    logs = []
    
    try:
        if filename.endswith(".json"):
            data = json.loads(content)
            if not isinstance(data, list):
                raise ValueError("JSON file must contain an array of log objects.")
            logs = data
        elif filename.endswith(".jsonl"):
            text = content.decode("utf-8")
            for line in text.strip().split("\n"):
                if line.strip():
                    logs.append(json.loads(line))
        elif filename.endswith(".csv"):
            text = content.decode("utf-8")
            reader = csv.DictReader(io.StringIO(text))
            for row in reader:
                logs.append(row)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use CSV, JSON, or JSONL.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
        
    required_fields = {"timestamp", "service", "level", "message"}
    valid_logs = []
    
    for log in logs:
        if not all(field in log for field in required_fields):
            raise HTTPException(status_code=400, detail=f"Missing required fields. Each log must contain: {', '.join(required_fields)}")
        log["user_id"] = user_id
        if "latency_ms" in log and log["latency_ms"]:
            try:
                log["latency_ms"] = float(log["latency_ms"])
            except ValueError:
                pass
        valid_logs.append(log)
        
    if not valid_logs:
        raise HTTPException(status_code=400, detail="File is empty or contains no valid logs.")
        
    try:
        collection = get_logs_collection()
        collection.insert_many(valid_logs)
        return {"status": "success", "imported_count": len(valid_logs)}
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Database error during import.")

@app.get("/")
async def root():
    """Confirm the API is running."""
    return {"message": "TraceMind API is running"}

@app.get("/health")
async def health_check(user_id: str = Depends(get_current_user)):
    """Return API status, MongoDB connection status, log count, and current health/anomaly info."""
    try:
        # Test MongoDB connection
        db_ok = test_connection()
        
        # Get total log count
        collection = get_logs_collection()
        log_count = collection.count_documents({"user_id": user_id})
        
        # Analyze current state (fetch all logs to get the full picture)
        # We don't limit this because the analyzer needs the full context to detect concentration/severity
        logs_cursor = collection.find({"user_id": user_id}).sort("timestamp", 1)
        all_logs = list(logs_cursor)
        analysis_result = analyze_logs(all_logs)
        
        has_featherless = bool(os.getenv("FEATHERLESS_API_KEY"))
        
        return {
            "api_status": "healthy",
            "mongodb_status": "connected" if db_ok else "disconnected",
            "total_logs": log_count,
            "health_score": analysis_result.get("health_score"),
            "severity": analysis_result.get("severity"),
            "affected_service": analysis_result.get("affected_service"),
            "incident_type": analysis_result.get("incident_type"),
            "anomaly_score": analysis_result.get("anomaly_score"),
            "ai_status": "configured" if has_featherless else "unconfigured"
        }
    except PyMongoError:
        # Avoid exposing credentials in error message
        return {
            "api_status": "healthy",
            "mongodb_status": "error",
            "error_detail": "Database connection failed",
            "analysis_status": "error"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error during health check")

@app.get("/logs")
async def get_logs(limit: int = Query(50, ge=1, le=200), user_id: str = Depends(get_current_user)):
    """Return logs from MongoDB, newest first. Max limit is 200."""
    try:
        collection = get_logs_collection()
        # Sort by timestamp descending (-1)
        cursor = collection.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
        logs = [serialize_mongo_doc(doc) for doc in cursor]
        return logs
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Database connection error")

@app.get("/logs/latest")
async def get_latest_log(user_id: str = Depends(get_current_user)):
    """Return the single newest log document."""
    try:
        collection = get_logs_collection()
        doc = collection.find_one({"user_id": user_id}, sort=[("timestamp", -1)])
        if not doc:
            raise HTTPException(status_code=404, detail="No logs found")
        return serialize_mongo_doc(doc)
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Database connection error")

@app.get("/anomalies")
async def get_anomalies(user_id: str = Depends(get_current_user)):
    """Return logs whose level is WARNING, ERROR, or CRITICAL."""
    try:
        collection = get_logs_collection()
        # Find logs with level in the anomaly list
        cursor = collection.find({"user_id": user_id, "level": {"$in": ["WARNING", "ERROR", "CRITICAL"]}}).sort("timestamp", -1)
        logs = [serialize_mongo_doc(doc) for doc in cursor]
        return logs
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Database connection error")


def _execute_analysis_pipeline(user_id: str, ensure_logs: bool = False):
    collection = get_logs_collection()
    cursor = collection.find({"user_id": user_id}).sort("timestamp", 1)
    all_logs = [serialize_mongo_doc(doc) for doc in cursor]
    
    if ensure_logs and not all_logs:
        raise ValueError("No telemetry imported for this user.")
        
    deterministic_result = analyze_logs(all_logs)
    enhanced_result, ai_status = investigate_incident(deterministic_result)
    sol_result, intel_status = generate_solutions(enhanced_result)
    rec_result, rec_status = rank_solutions(sol_result)
    rem_result, rem_status = execute_remediation(rec_result)
    final_result, ver_status = verify_recovery(rem_result)
    
    final_result["ai_provider"] = "featherless" if ai_status == "connected" else "deterministic_fallback"
    final_result["ai_status"] = ai_status
    
    return final_result

@app.post("/analysis/run")
async def run_analysis(user_id: str = Depends(get_current_user)):
    try:
        return _execute_analysis_pipeline(user_id, ensure_logs=True)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Database connection error")

@app.get("/analysis")
async def get_analysis(user_id: str = Depends(get_current_user)):
    """
    Returns the current deterministic TraceMind incident analysis.
    """
    try:
        return _execute_analysis_pipeline(user_id, ensure_logs=False)
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Database connection error")
