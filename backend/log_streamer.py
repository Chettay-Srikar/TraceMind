"""
TraceMind — Log Streamer

Reads simulated logs from data/logs.json and streams them ONE AT A TIME
into MongoDB with an artificial delay.

Usage:
    python -m backend.log_streamer
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from pymongo.errors import PyMongoError

# Import the existing database connection function
from backend.database import get_logs_collection

# ─── Configuration ────────────────────────────────────────────────────────────
LOGS_FILE_PATH = Path(__file__).resolve().parent.parent / "data" / "logs.json"

# Default to 2 seconds, but allow override via environment variable
try:
    INTERVAL_SECONDS = float(os.getenv("LOG_INTERVAL_SECONDS", "2.0"))
except ValueError:
    print("Warning: LOG_INTERVAL_SECONDS is not a valid number. Defaulting to 2.0s.")
    INTERVAL_SECONDS = 2.0

def load_logs():
    """Load and validate the JSON logs file."""
    if not LOGS_FILE_PATH.exists():
        print(f"Error: Logs file not found at {LOGS_FILE_PATH}")
        sys.exit(1)
        
    try:
        with open(LOGS_FILE_PATH, "r", encoding="utf-8") as f:
            logs = json.load(f)
    except json.JSONDecodeError as err:
        print(f"Error: Invalid JSON in {LOGS_FILE_PATH}: {err}")
        sys.exit(1)
        
    if not isinstance(logs, list):
        print(f"Error: Expected a JSON array in {LOGS_FILE_PATH}, but got {type(logs).__name__}")
        sys.exit(1)
        
    return logs

def stream_logs(collection, logs):
    """Stream logs to MongoDB one by one with a delay."""
    print(f"Found {len(logs)} logs to stream.")
    print(f"Streaming interval set to {INTERVAL_SECONDS} seconds.")
    print("Press Ctrl+C to stop.\n")
    
    try:
        for index, log_entry in enumerate(logs, start=1):
            # Create a copy to avoid modifying the original loaded dict (though not strictly necessary here, good practice)
            doc_to_insert = dict(log_entry)
            
            # Add ingested_at timestamp (UTC ISO 8601)
            doc_to_insert["ingested_at"] = datetime.now(timezone.utc).isoformat()
            
            # Print the required format: [STREAM] <level> <service> -> MongoDB
            level = doc_to_insert.get("level", "UNKNOWN")
            service = doc_to_insert.get("service", "unknown-service")
            print(f"[STREAM] {level} {service} -> MongoDB", end=" ")
            
            try:
                # Insert the document
                result = collection.insert_one(doc_to_insert)
                print(f"(Success: ID {result.inserted_id}) - [{index}/{len(logs)}]")
            except PyMongoError as e:
                # Handle MongoDB errors cleanly without exposing credentials
                print(f"\nFailed to insert document into MongoDB. Database error occurred.")
                print(f"Error details: {type(e).__name__}: {e}")
                # We can choose to continue or break; let's break on DB errors as they are likely systemic
                break
                
            # Wait for the interval, unless this is the last item
            if index < len(logs):
                time.sleep(INTERVAL_SECONDS)
                
        print("\nStreaming completed successfully.")
        
    except KeyboardInterrupt:
        print("\n\n[Shutdown] Ctrl+C received. Stopping log streaming gracefully.")
        sys.exit(0)
    except Exception as e:
        print(f"\nAn unexpected error occurred: {type(e).__name__}: {e}")
        sys.exit(1)

def main():
    print("Starting TraceMind Log Streamer...")
    
    # 1. Get the MongoDB collection using the existing database module
    try:
        collection = get_logs_collection()
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        sys.exit(1)
        
    # 2. Load the logs
    logs = load_logs()
    
    # 3. Stream them
    stream_logs(collection, logs)

if __name__ == "__main__":
    main()
