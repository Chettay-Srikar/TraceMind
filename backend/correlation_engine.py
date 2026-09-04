import uuid
from typing import List, Dict, Any
from collections import Counter
from datetime import datetime

def _safe_get(log: dict, key: str, default: Any = None) -> Any:
    return log.get(key, default)

def correlate_incident(logs: List[dict]) -> Dict[str, Any]:
    """
    Extracts a correlated incident timeline and metadata from a raw list of logs.
    """
    if not logs:
        return _empty_incident()

    # Find the dominant abnormal scenario
    abnormal_logs = [log for log in logs if _safe_get(log, "level", "INFO") in ["WARNING", "ERROR", "CRITICAL"]]
    if not abnormal_logs:
        return _empty_incident()

    scenarios = [_safe_get(log, "scenario", "unknown") for log in abnormal_logs if _safe_get(log, "scenario") not in ["normal", "unknown"]]
    if not scenarios:
        return _empty_incident()

    dominant_scenario = Counter(scenarios).most_common(1)[0][0]

    # Filter all logs related to this dominant scenario
    related_logs = [log for log in logs if _safe_get(log, "scenario") == dominant_scenario]
    if not related_logs:
        return _empty_incident()

    # Sort chronologically
    try:
        related_logs.sort(key=lambda x: datetime.fromisoformat(_safe_get(x, "timestamp")))
    except Exception:
        pass # If parsing fails, preserve original order

    # Extract metadata
    timeline = related_logs
    trigger_event = timeline[0] if timeline else {}
    
    # Peak event (highest severity)
    severity_order = {"CRITICAL": 4, "ERROR": 3, "WARNING": 2, "INFO": 1}
    peak_event = max(timeline, key=lambda x: severity_order.get(_safe_get(x, "level", "INFO"), 0)) if timeline else {}
    
    # Overall Severity
    highest_severity = _safe_get(peak_event, "level", "INFO") if peak_event else "NORMAL"
    
    # Affected Services
    affected_services = list(set(_safe_get(log, "service", "unknown") for log in timeline))
    
    # Status
    # Deterministic check: Does the sequence end in an INFO recovery log for all affected services?
    # Simple check for now: If the last log is INFO, it MIGHT be recovered.
    # But usually incident traces in this simulation end in CRITICAL/ERROR.
    last_log_level = _safe_get(timeline[-1], "level", "INFO") if timeline else "INFO"
    status = "active" if last_log_level in ["WARNING", "ERROR", "CRITICAL"] else "resolved"

    # Correlation Score
    score = 10 # Base score for having an incident
    levels_present = set(_safe_get(log, "level", "INFO") for log in timeline)
    
    if len([l for l in ["INFO", "WARNING", "ERROR", "CRITICAL"] if l in levels_present]) >= 3:
        score += 40 # Clear progression
        
    if len(affected_services) > 1:
        score += 30 # Multi-service correlation
        
    try:
        if len(timeline) >= 2:
            start_time = datetime.fromisoformat(_safe_get(timeline[0], "timestamp"))
            end_time = datetime.fromisoformat(_safe_get(timeline[-1], "timestamp"))
            if (end_time - start_time).total_seconds() < 300: # Within 5 minutes
                score += 20
    except Exception:
        pass

    return {
        "incident_id": f"INC-{str(uuid.uuid4())[:8]}",
        "incident_type": dominant_scenario,
        "severity": highest_severity,
        "affected_services": affected_services,
        "correlation_score": min(100, score),
        "status": status,
        "trigger_event": trigger_event,
        "peak_event": peak_event,
        "timeline": timeline
    }

def _empty_incident() -> Dict[str, Any]:
    return {
        "incident_id": f"INC-{str(uuid.uuid4())[:8]}",
        "incident_type": "normal",
        "severity": "NORMAL",
        "affected_services": [],
        "correlation_score": 0,
        "status": "resolved",
        "trigger_event": {},
        "peak_event": {},
        "timeline": []
    }
