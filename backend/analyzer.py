"""
TraceMind — Deterministic Analysis Engine

Analyzes a list of MongoDB log documents and returns a single, deterministic
analysis result containing health score, anomaly score, severity, root cause,
and recommended actions.
"""

from typing import List, Dict, Any
from collections import Counter
from backend.correlation_engine import correlate_incident

def _safe_get(log: dict, key: str, default: Any = None) -> Any:
    """Safely get a value from a log dictionary."""
    return log.get(key, default)

def determine_severity(logs: List[dict]) -> str:
    """Determine the highest severity present in the logs."""
    if not logs:
        return "NORMAL"
    
    levels = [_safe_get(log, "level", "INFO") for log in logs]
    
    if "CRITICAL" in levels:
        return "CRITICAL"
    if "ERROR" in levels:
        return "HIGH"
    if "WARNING" in levels:
        return "WARNING"
    return "NORMAL"

def calculate_health_score(logs: List[dict], severity: str) -> int:
    """Calculate a deterministic health score from 0-100."""
    if not logs:
        return 100
        
    total = len(logs)
    abnormal_count = sum(1 for log in logs if _safe_get(log, "level", "INFO") in ["WARNING", "ERROR", "CRITICAL"])
    abnormal_ratio = abnormal_count / total if total > 0 else 0
    
    # Base score on ratio of normal to abnormal
    score = 100 - int(abnormal_ratio * 100)
    
    # Cap score based on maximum severity observed
    if severity == "CRITICAL":
        score = min(score, 39)
    elif severity == "HIGH":
        score = min(score, 69)
    elif severity == "WARNING":
        score = min(score, 89)
        
    return max(0, min(100, score))

def calculate_anomaly_score(logs: List[dict], severity: str) -> int:
    """Calculate a deterministic anomaly score from 0-100."""
    if not logs:
        return 0
        
    total = len(logs)
    weights = {"INFO": 0, "WARNING": 3, "ERROR": 10, "CRITICAL": 20}
    
    score_accumulator = 0
    for log in logs:
        lvl = _safe_get(log, "level", "INFO")
        score_accumulator += weights.get(lvl, 0)
        
        # Factor in response time spikes if present
        rt = _safe_get(log, "response_time_ms")
        if isinstance(rt, (int, float)) and rt > 1000:
            score_accumulator += 2
            
    # Normalize somewhat based on log volume to prevent unbounded growth, 
    # but still allow concentration to spike it
    raw_score = (score_accumulator / total) * 10 if total > 0 else 0
    
    if severity == "CRITICAL":
        raw_score += 50
    elif severity == "HIGH":
        raw_score += 30
    elif severity == "WARNING":
        raw_score += 10
        
    return max(0, min(100, int(raw_score)))

def determine_affected_service(logs: List[dict]) -> str:
    """Identify the service with the strongest concentration of abnormal logs."""
    abnormal_logs = [log for log in logs if _safe_get(log, "level", "INFO") in ["WARNING", "ERROR", "CRITICAL"]]
    
    if not abnormal_logs:
        return "None"
        
    services = [_safe_get(log, "service", "unknown") for log in abnormal_logs]
    counter = Counter(services)
    
    if not counter:
        return "None"
        
    most_common = counter.most_common(1)
    return most_common[0][0] if most_common else "None"

def determine_incident_type(logs: List[dict]) -> str:
    """Determine the dominant incident type based on scenarios."""
    abnormal_logs = [log for log in logs if _safe_get(log, "level", "INFO") in ["WARNING", "ERROR", "CRITICAL"]]
    
    if not abnormal_logs:
        return "normal"
        
    scenarios = [_safe_get(log, "scenario", "unknown") for log in abnormal_logs]
    
    # Filter out normal/unknown if there are actual incidents
    real_incidents = [s for s in scenarios if s not in ["normal", "unknown"]]
    
    if not real_incidents:
        return "normal"
        
    counter = Counter(real_incidents)
    most_common = counter.most_common(1)
    return most_common[0][0] if most_common else "normal"

def generate_root_cause(incident_type: str) -> str:
    """Generate human-readable root cause based on incident_type."""
    causes = {
        "database_failure": "Database connection pool exhaustion is causing database timeouts and downstream request failures.",
        "memory_problem": "High memory pressure is causing degraded service performance.",
        "api_timeout": "Upstream API latency is causing gateway request timeouts.",
        "network_problem": "Network connectivity problems are causing service communication failures.",
        "cpu_overload": "CPU saturation is causing increased request processing latency.",
        "normal": "No significant incident detected. System activity appears healthy."
    }
    return causes.get(incident_type, f"Unknown incident detected: {incident_type}")

def generate_recommended_action(incident_type: str) -> str:
    """Generate deterministic recommendations."""
    actions = {
        "database_failure": "Investigate database connection leaks and restart the affected service if necessary.",
        "memory_problem": "Investigate memory growth and restart the affected service if memory pressure continues.",
        "api_timeout": "Investigate the upstream service and reduce timeout failures.",
        "network_problem": "Investigate network connectivity and service reachability.",
        "cpu_overload": "Investigate CPU-intensive operations and scale or restart the affected service.",
        "normal": "Continue monitoring system activity."
    }
    return actions.get(incident_type, "Investigate system logs for anomalous behavior.")

def calculate_confidence(logs: List[dict], incident_type: str, affected_service: str) -> int:
    """Calculate confidence from consistency of evidence."""
    if not logs:
        return 100
        
    if incident_type == "normal":
        return 95  # Usually confident if we see nothing wrong
        
    abnormal_logs = [log for log in logs if _safe_get(log, "level", "INFO") in ["WARNING", "ERROR", "CRITICAL"]]
    if not abnormal_logs:
        return 50
        
    # Points for consistency
    score = 40 
    
    # Do abnormal logs agree on scenario?
    matching_scenario = sum(1 for log in abnormal_logs if _safe_get(log, "scenario") == incident_type)
    if matching_scenario / len(abnormal_logs) > 0.7:
        score += 30
        
    # Do abnormal logs isolate a service?
    matching_service = sum(1 for log in abnormal_logs if _safe_get(log, "service") == affected_service)
    if matching_service / len(abnormal_logs) > 0.5:
        score += 30
        
    return min(100, int(score))

def build_evidence(logs: List[dict], severity: str, affected_service: str, incident_type: str) -> List[str]:
    """Build a concise list of evidence."""
    evidence = []
    
    if not logs:
        return ["No logs provided for analysis."]
        
    if severity == "NORMAL":
        evidence.append(f"Analyzed {len(logs)} logs; activity is within normal parameters.")
        return evidence
        
    # Count severities
    levels = [_safe_get(log, "level", "INFO") for log in logs]
    counts = Counter(levels)
    
    for lvl in ["CRITICAL", "ERROR", "WARNING"]:
        if counts[lvl] > 0:
            evidence.append(f"{counts[lvl]} {lvl} logs detected.")
            
    if affected_service != "None":
        evidence.append(f"'{affected_service}' service has the highest abnormal-log concentration.")
        
    if incident_type != "normal":
        evidence.append(f"'{incident_type}' scenario appears repeatedly in recent telemetry.")
        
    # Check for high response times
    high_rt_count = sum(1 for log in logs if isinstance(_safe_get(log, "response_time_ms"), (int, float)) and _safe_get(log, "response_time_ms") > 1000)
    if high_rt_count > 0:
        evidence.append(f"Response times increased significantly (>{high_rt_count} requests over 1000ms).")
        
    return evidence

def calculate_metrics(logs: List[dict]) -> Dict[str, Any]:
    """Calculate aggregate telemetry metrics."""
    total_log_count = len(logs)
    critical_log_count = 0
    error_log_count = 0
    warning_log_count = 0
    
    rt_sum = 0
    rt_count = 0
    
    for log in logs:
        lvl = _safe_get(log, "level", "INFO")
        if lvl == "CRITICAL":
            critical_log_count += 1
        elif lvl == "ERROR":
            error_log_count += 1
        elif lvl == "WARNING":
            warning_log_count += 1
            
        rt = _safe_get(log, "response_time_ms")
        if isinstance(rt, (int, float)):
            rt_sum += rt
            rt_count += 1
            
    abnormal_log_count = critical_log_count + error_log_count + warning_log_count
    avg_rt = round(rt_sum / rt_count, 2) if rt_count > 0 else 0
    
    return {
        "total_log_count": total_log_count,
        "abnormal_log_count": abnormal_log_count,
        "critical_log_count": critical_log_count,
        "error_log_count": error_log_count,
        "warning_log_count": warning_log_count,
        "average_response_time_ms": avg_rt
    }

def analyze_logs(logs: List[dict]) -> Dict[str, Any]:
    """
    Main entry point for the analysis engine.
    Accepts a list of log dictionaries and returns a structured analysis result.
    """
    if not isinstance(logs, list):
        logs = []
        
    severity = determine_severity(logs)
    health_score = calculate_health_score(logs, severity)
    anomaly_score = calculate_anomaly_score(logs, severity)
    affected_service = determine_affected_service(logs)
    incident_type = determine_incident_type(logs)
    root_cause = generate_root_cause(incident_type)
    recommended_action = generate_recommended_action(incident_type)
    confidence = calculate_confidence(logs, incident_type, affected_service)
    evidence = build_evidence(logs, severity, affected_service, incident_type)
    metrics = calculate_metrics(logs)
    incident = correlate_incident(logs)
    
    return {
        "health_score": health_score,
        "severity": severity,
        "anomaly_score": anomaly_score,
        "affected_service": affected_service,
        "incident_type": incident_type,
        "root_cause": root_cause,
        "confidence": confidence,
        "recommended_action": recommended_action,
        "evidence": evidence,
        "metrics": metrics,
        "incident": incident
    }


# ─── Testing Block ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json
    from pathlib import Path
    
    def run_tests():
        logs_path = Path(__file__).resolve().parent.parent / "data" / "logs.json"
        if not logs_path.exists():
            print("logs.json not found, skipping tests.")
            return
            
        with open(logs_path, "r", encoding="utf-8") as f:
            all_logs = json.load(f)
            
        print(f"Loaded {len(all_logs)} logs for testing.\\n")
        
        test_cases = {
            "1. normal_logs": [l for l in all_logs if l.get("scenario") == "normal"],
            "2. database_logs": [l for l in all_logs if l.get("scenario") == "database_failure"],
            "3. memory_logs": [l for l in all_logs if l.get("scenario") == "memory_problem"],
            "4. api_timeout_logs": [l for l in all_logs if l.get("scenario") == "api_timeout"],
            "5. network_logs": [l for l in all_logs if l.get("scenario") == "network_problem"],
            "6. cpu_logs": [l for l in all_logs if l.get("scenario") == "cpu_overload"],
            "7. full_logs": all_logs,
            "8. empty_logs": [],
            "9. malformed/missing-field logs": [{"timestamp": "2026-09-04T08:00:12", "level": "WARNING"}]
        }
        
        for name, logs_subset in test_cases.items():
            print(f"--- Test Case: {name} ({len(logs_subset)} logs) ---")
            try:
                result = analyze_logs(logs_subset)
                print(json.dumps(result, indent=2))
            except Exception as e:
                print(f"CRASHED! {e}")
            print("\\n")
            
    run_tests()
