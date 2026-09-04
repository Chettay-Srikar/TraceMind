"""
TraceMind — FastAPI Entry Point

Provides REST API endpoints to access simulated logs stored in MongoDB.
"""

from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import PyMongoError
from pydantic import BaseModel

from backend.database import get_logs_collection, test_connection
from backend.analyzer import analyze_logs
from backend.ai_investigator import investigate_incident
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

@app.get("/")
async def root():
    """Confirm the API is running."""
    return {"message": "TraceMind API is running"}

@app.get("/health")
async def health_check():
    """Return API status, MongoDB connection status, log count, and current health/anomaly info."""
    try:
        # Test MongoDB connection
        db_ok = test_connection()
        
        # Get total log count
        collection = get_logs_collection()
        log_count = collection.count_documents({})
        
        # Analyze current state (fetch all logs to get the full picture)
        # We don't limit this because the analyzer needs the full context to detect concentration/severity
        logs_cursor = collection.find({}).sort("timestamp", 1)
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
async def get_logs(limit: int = Query(50, ge=1, le=200)):
    """Return logs from MongoDB, newest first. Max limit is 200."""
    try:
        collection = get_logs_collection()
        # Sort by timestamp descending (-1)
        cursor = collection.find({}).sort("timestamp", -1).limit(limit)
        logs = [serialize_mongo_doc(doc) for doc in cursor]
        return logs
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Database connection error")

@app.get("/logs/latest")
async def get_latest_log():
    """Return the single newest log document."""
    try:
        collection = get_logs_collection()
        doc = collection.find_one(sort=[("timestamp", -1)])
        if not doc:
            raise HTTPException(status_code=404, detail="No logs found")
        return serialize_mongo_doc(doc)
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Database connection error")

@app.get("/anomalies")
async def get_anomalies():
    """Return logs whose level is WARNING, ERROR, or CRITICAL."""
    try:
        collection = get_logs_collection()
        # Find logs with level in the anomaly list
        cursor = collection.find({"level": {"$in": ["WARNING", "ERROR", "CRITICAL"]}}).sort("timestamp", -1)
        logs = [serialize_mongo_doc(doc) for doc in cursor]
        return logs
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Database connection error")

@app.get("/analysis")
async def get_analysis():
    """
    Returns the current deterministic TraceMind incident analysis.
    
    The response contains the following fields:
    - health_score
    - severity
    - anomaly_score
    - affected_service
    - incident_type
    - root_cause
    - confidence
    - recommended_action
    - evidence
    - metrics
      - total_log_count
      - abnormal_log_count
      - critical_log_count
      - error_log_count
      - warning_log_count
      - average_response_time_ms
    """
    try:
        collection = get_logs_collection()
        # Fetch all logs for a complete analysis
        cursor = collection.find({}).sort("timestamp", 1)
        all_logs = list(cursor)
        
        # Analyze them deterministically
        deterministic_result = analyze_logs(all_logs)
        
        # Enhance with AI Investigation
        enhanced_result, ai_status = investigate_incident(deterministic_result)
        
        # Add AI status to response
        enhanced_result["ai_provider"] = "featherless" if ai_status == "connected" else "deterministic_fallback"
        enhanced_result["ai_status"] = ai_status
        
        return enhanced_result
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Database connection error")

