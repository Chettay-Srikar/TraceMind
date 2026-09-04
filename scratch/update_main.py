import os
import re

def update_main():
    with open("backend/main.py", "r") as f:
        content = f.read()
        
    # Add imports
    import_addition = """from typing import List, Optional
import csv
import json
import io
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Depends
from backend.auth import get_current_user"""
    content = content.replace("from typing import List, Optional\nfrom fastapi import FastAPI, HTTPException, Query", import_addition)
    
    # Add POST /logs/import before @app.get("/")
    import_endpoint = """
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
            for line in text.strip().split("\\n"):
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

@app.get("/")"""
    content = content.replace("@app.get(\"/\")", import_endpoint)
    
    # Update health_check
    health_old = """@app.get("/health")
async def health_check():
    \"\"\"Return API status, MongoDB connection status, log count, and current health/anomaly info.\"\"\"
    try:
        # Test MongoDB connection
        db_ok = test_connection()
        
        # Get total log count
        collection = get_logs_collection()
        log_count = collection.count_documents({})
        
        # Analyze current state (fetch all logs to get the full picture)
        # We don't limit this because the analyzer needs the full context to detect concentration/severity
        logs_cursor = collection.find({}).sort("timestamp", 1)"""
    health_new = """@app.get("/health")
async def health_check(user_id: str = Depends(get_current_user)):
    \"\"\"Return API status, MongoDB connection status, log count, and current health/anomaly info.\"\"\"
    try:
        # Test MongoDB connection
        db_ok = test_connection()
        
        # Get total log count
        collection = get_logs_collection()
        log_count = collection.count_documents({"user_id": user_id})
        
        # Analyze current state (fetch all logs to get the full picture)
        # We don't limit this because the analyzer needs the full context to detect concentration/severity
        logs_cursor = collection.find({"user_id": user_id}).sort("timestamp", 1)"""
    content = content.replace(health_old, health_new)
    
    # Update get_logs
    get_logs_old = """@app.get("/logs")
async def get_logs(limit: int = Query(50, ge=1, le=200)):
    \"\"\"Return logs from MongoDB, newest first. Max limit is 200.\"\"\"
    try:
        collection = get_logs_collection()
        # Sort by timestamp descending (-1)
        cursor = collection.find({}).sort("timestamp", -1).limit(limit)"""
    get_logs_new = """@app.get("/logs")
async def get_logs(limit: int = Query(50, ge=1, le=200), user_id: str = Depends(get_current_user)):
    \"\"\"Return logs from MongoDB, newest first. Max limit is 200.\"\"\"
    try:
        collection = get_logs_collection()
        # Sort by timestamp descending (-1)
        cursor = collection.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)"""
    content = content.replace(get_logs_old, get_logs_new)
    
    # Update get_latest_log
    latest_old = """@app.get("/logs/latest")
async def get_latest_log():
    \"\"\"Return the single newest log document.\"\"\"
    try:
        collection = get_logs_collection()
        doc = collection.find_one(sort=[("timestamp", -1)])"""
    latest_new = """@app.get("/logs/latest")
async def get_latest_log(user_id: str = Depends(get_current_user)):
    \"\"\"Return the single newest log document.\"\"\"
    try:
        collection = get_logs_collection()
        doc = collection.find_one({"user_id": user_id}, sort=[("timestamp", -1)])"""
    content = content.replace(latest_old, latest_new)
    
    # Update get_anomalies
    anomalies_old = """@app.get("/anomalies")
async def get_anomalies():
    \"\"\"Return logs whose level is WARNING, ERROR, or CRITICAL.\"\"\"
    try:
        collection = get_logs_collection()
        # Find logs with level in the anomaly list
        cursor = collection.find({"level": {"$in": ["WARNING", "ERROR", "CRITICAL"]}}).sort("timestamp", -1)"""
    anomalies_new = """@app.get("/anomalies")
async def get_anomalies(user_id: str = Depends(get_current_user)):
    \"\"\"Return logs whose level is WARNING, ERROR, or CRITICAL.\"\"\"
    try:
        collection = get_logs_collection()
        # Find logs with level in the anomaly list
        cursor = collection.find({"user_id": user_id, "level": {"$in": ["WARNING", "ERROR", "CRITICAL"]}}).sort("timestamp", -1)"""
    content = content.replace(anomalies_old, anomalies_new)
    
    # Update get_analysis
    analysis_old = """@app.get("/analysis")
async def get_analysis():
    \"\"\"
    Returns the current deterministic TraceMind incident analysis.
    
    The response contains the following fields:"""
    analysis_new = """@app.get("/analysis")
async def get_analysis(user_id: str = Depends(get_current_user)):
    \"\"\"
    Returns the current deterministic TraceMind incident analysis.
    
    The response contains the following fields:"""
    content = content.replace(analysis_old, analysis_new)
    
    analysis_cursor_old = """        collection = get_logs_collection()
        # Fetch all logs for a complete analysis
        cursor = collection.find({}).sort("timestamp", 1)"""
    analysis_cursor_new = """        collection = get_logs_collection()
        # Fetch all logs for a complete analysis
        cursor = collection.find({"user_id": user_id}).sort("timestamp", 1)"""
    content = content.replace(analysis_cursor_old, analysis_cursor_new)
    
    with open("backend/main.py", "w") as f:
        f.write(content)

update_main()
