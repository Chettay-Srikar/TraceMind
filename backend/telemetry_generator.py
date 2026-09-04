import json
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional

# Constants
SERVICES = [
    "api-gateway",
    "payment-service",
    "database",
    "auth-service",
    "user-service",
    "notification-service"
]

LEVELS = ["INFO", "WARNING", "ERROR", "CRITICAL"]

SCENARIOS = [
    "normal",
    "database failure",
    "memory problem",
    "api timeout",
    "network problem",
    "cpu overload"
]

LOGS_FILE_PATH = Path(__file__).resolve().parent.parent / "data" / "logs.json"

def generate_timestamp(base_time: datetime, offset_seconds: int) -> str:
    """Generate a chronologically offset timestamp in ISO 8601 format."""
    return (base_time + timedelta(seconds=offset_seconds)).isoformat(timespec="seconds")

def create_log(timestamp: str, service: str, level: str, message: str, response_time_ms: int, scenario: str) -> Dict[str, Any]:
    """Create a structured log entry."""
    return {
        "timestamp": timestamp,
        "service": service,
        "level": level,
        "message": message,
        "response_time_ms": response_time_ms,
        "scenario": scenario
    }

def validate_logs(logs: List[Dict[str, Any]]) -> bool:
    """Validate generated logs against required schemas."""
    if not isinstance(logs, list):
        return False
        
    for log in logs:
        # Check required fields
        for field in ["timestamp", "service", "level", "message", "response_time_ms", "scenario"]:
            if field not in log:
                return False
                
        # Validate values
        if log["service"] not in SERVICES:
            return False
        if log["level"] not in LEVELS:
            return False
        if not isinstance(log["response_time_ms"], (int, float)):
            return False
        if log["scenario"] not in SCENARIOS:
            return False
            
    # Check chronological ordering
    try:
        timestamps = [datetime.fromisoformat(log["timestamp"]) for log in logs]
        if timestamps != sorted(timestamps):
            return False
    except ValueError:
        return False
        
    return True

def generate_normal_traffic(base_time: datetime, count: int, start_offset: int = 0) -> List[Dict[str, Any]]:
    """Generate generic background traffic (NORMAL)."""
    logs = []
    current_offset = start_offset
    for _ in range(count):
        current_offset += random.randint(1, 30)
        service = random.choice(SERVICES)
        response_time = random.randint(20, 150)
        logs.append(create_log(
            generate_timestamp(base_time, current_offset),
            service,
            "INFO",
            f"{service} processed request normally",
            response_time,
            "normal"
        ))
    return logs

def generate_database_failure_incident(base_time: datetime, start_offset: int) -> List[Dict[str, Any]]:
    """Generate a correlated sequence for a database failure."""
    logs = []
    # NORMAL
    offset = start_offset
    logs.append(create_log(generate_timestamp(base_time, offset), "database", "INFO", "Database query executed normally", random.randint(50, 150), "database failure"))
    
    # WARNING
    offset += random.randint(5, 15)
    logs.append(create_log(generate_timestamp(base_time, offset), "database", "WARNING", "Database query latency increasing", random.randint(300, 800), "database failure"))
    
    # ERROR
    offset += random.randint(5, 15)
    logs.append(create_log(generate_timestamp(base_time, offset), "user-service", "ERROR", "User service failed to fetch data from database", random.randint(1000, 3000), "database failure"))
    logs.append(create_log(generate_timestamp(base_time, offset + 1), "payment-service", "ERROR", "Payment service database transaction failed", random.randint(1500, 3500), "database failure"))
    
    # CRITICAL
    offset += random.randint(5, 15)
    logs.append(create_log(generate_timestamp(base_time, offset), "api-gateway", "CRITICAL", "API Gateway returned 500 Internal Server Error due to upstream failures", random.randint(3000, 5000), "database failure"))
    
    return logs

def generate_memory_problem_incident(base_time: datetime, start_offset: int) -> List[Dict[str, Any]]:
    """Generate a correlated sequence for a memory problem."""
    logs = []
    # NORMAL
    offset = start_offset
    logs.append(create_log(generate_timestamp(base_time, offset), "notification-service", "INFO", "Garbage collection completed", random.randint(20, 50), "memory problem"))
    
    # WARNING
    offset += random.randint(30, 60)
    logs.append(create_log(generate_timestamp(base_time, offset), "notification-service", "WARNING", "High memory usage detected (85%)", random.randint(100, 250), "memory problem"))
    
    # ERROR
    offset += random.randint(30, 60)
    logs.append(create_log(generate_timestamp(base_time, offset), "notification-service", "ERROR", "Frequent GC pauses impacting performance", random.randint(500, 1000), "memory problem"))
    
    # CRITICAL
    offset += random.randint(10, 30)
    logs.append(create_log(generate_timestamp(base_time, offset), "notification-service", "CRITICAL", "OutOfMemoryError: Java heap space", random.randint(2000, 4000), "memory problem"))
    
    return logs

def generate_api_timeout_incident(base_time: datetime, start_offset: int) -> List[Dict[str, Any]]:
    """Generate a correlated sequence for an API timeout."""
    logs = []
    offset = start_offset
    logs.append(create_log(generate_timestamp(base_time, offset), "payment-service", "INFO", "Payment request received", random.randint(100, 200), "api timeout"))
    offset += random.randint(5, 10)
    logs.append(create_log(generate_timestamp(base_time, offset), "payment-service", "WARNING", "Payment processor taking longer than expected", random.randint(1500, 3000), "api timeout"))
    offset += random.randint(5, 10)
    logs.append(create_log(generate_timestamp(base_time, offset), "payment-service", "ERROR", "Payment processor timed out", random.randint(5000, 6000), "api timeout"))
    offset += random.randint(1, 5)
    logs.append(create_log(generate_timestamp(base_time, offset), "api-gateway", "CRITICAL", "504 Gateway Timeout while proxying to payment-service", random.randint(5500, 6500), "api timeout"))
    return logs
    
def generate_network_problem_incident(base_time: datetime, start_offset: int) -> List[Dict[str, Any]]:
    """Generate a correlated sequence for a network problem."""
    logs = []
    offset = start_offset
    logs.append(create_log(generate_timestamp(base_time, offset), "auth-service", "INFO", "Authenticating user", random.randint(30, 80), "network problem"))
    offset += random.randint(2, 5)
    logs.append(create_log(generate_timestamp(base_time, offset), "auth-service", "WARNING", "Network latency spike detected when connecting to user database", random.randint(400, 800), "network problem"))
    offset += random.randint(5, 10)
    logs.append(create_log(generate_timestamp(base_time, offset), "auth-service", "ERROR", "Connection refused to user database", random.randint(1000, 2000), "network problem"))
    offset += random.randint(1, 3)
    logs.append(create_log(generate_timestamp(base_time, offset), "api-gateway", "CRITICAL", "401 Unauthorized due to downstream auth failure", random.randint(1200, 2200), "network problem"))
    return logs
    
def generate_cpu_overload_incident(base_time: datetime, start_offset: int) -> List[Dict[str, Any]]:
    """Generate a correlated sequence for a CPU overload."""
    logs = []
    offset = start_offset
    logs.append(create_log(generate_timestamp(base_time, offset), "user-service", "INFO", "Processing complex user data export", random.randint(150, 300), "cpu overload"))
    offset += random.randint(15, 30)
    logs.append(create_log(generate_timestamp(base_time, offset), "user-service", "WARNING", "CPU utilization at 90%", random.randint(800, 1200), "cpu overload"))
    offset += random.randint(15, 30)
    logs.append(create_log(generate_timestamp(base_time, offset), "user-service", "ERROR", "Request queue full, dropping incoming requests", random.randint(2500, 3500), "cpu overload"))
    offset += random.randint(5, 10)
    logs.append(create_log(generate_timestamp(base_time, offset), "api-gateway", "CRITICAL", "503 Service Unavailable for user-service endpoints", random.randint(3000, 4000), "cpu overload"))
    return logs

def generate_telemetry(seed: Optional[int] = None) -> List[Dict[str, Any]]:
    """Generate all telemetry data including normal traffic and incidents."""
    if seed is not None:
        random.seed(seed)
        
    base_time = datetime(2026, 9, 4, 8, 0, 0)
    
    # We will generate batches of logs and then sort them chronologically
    all_logs = []
    
    # 1. Base normal traffic
    all_logs.extend(generate_normal_traffic(base_time, 50, start_offset=0))
    
    # 2. Incidents spaced out over time
    all_logs.extend(generate_database_failure_incident(base_time, start_offset=200))
    all_logs.extend(generate_memory_problem_incident(base_time, start_offset=500))
    all_logs.extend(generate_api_timeout_incident(base_time, start_offset=800))
    all_logs.extend(generate_network_problem_incident(base_time, start_offset=1200))
    all_logs.extend(generate_cpu_overload_incident(base_time, start_offset=1600))
    
    # 3. Sort chronologically
    all_logs.sort(key=lambda x: x["timestamp"])
    
    return all_logs

def write_logs_to_file(logs: List[Dict[str, Any]], filepath: Path):
    """Write generated logs to JSON file."""
    # Ensure directory exists
    filepath.parent.mkdir(parents=True, exist_ok=True)
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(logs, f, indent=2)

def main():
    print("Generating telemetry data...")
    # Make generation deterministic by default for hackathons if executed directly
    logs = generate_telemetry(seed=42)
    
    print("Validating generated data...")
    if not validate_logs(logs):
        print("Error: Generated logs failed validation!")
        sys.exit(1)
        
    print(f"Writing {len(logs)} records to {LOGS_FILE_PATH}")
    write_logs_to_file(logs, LOGS_FILE_PATH)
    print("Telemetry generation complete.")

if __name__ == "__main__":
    main()
