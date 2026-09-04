import uuid
from typing import Dict, Any

def verify_recovery(final_result: Dict[str, Any]) -> tuple[Dict[str, Any], str]:
    """
    Simulates a post-remediation health check to verify recovery deterministically.
    Returns (result_with_verification, status).
    """
    result = dict(final_result)
    
    remediation_block = result.get("remediation", {})
    rem_status = remediation_block.get("status", "unknown")
    
    verification_id = f"ver-{str(uuid.uuid4())[:8]}"
    
    # Not Verified conditions
    if rem_status in ["skipped", "unknown", "failed"]:
        return _apply_skipped(result, verification_id, f"Remediation was {rem_status}.")
        
    pre_state = remediation_block.get("pre_remediation_state", {})
    if not pre_state:
        return _apply_skipped(result, verification_id, "Missing pre-remediation state.")
        
    incident_type = pre_state.get("incident_type", "normal")
    if incident_type == "normal":
        return _apply_skipped(result, verification_id, "System is normal.")
        
    # Calculate deterministic simulated improvement
    solution_id = remediation_block.get("solution_id", "")
    
    pre_health = pre_state.get("health_score", 100)
    pre_anomaly = pre_state.get("anomaly_score", 0)
    pre_severity = pre_state.get("severity", "NORMAL")
    
    post_health, post_anomaly, post_severity = _simulate_post_state(
        incident_type, solution_id, pre_health, pre_anomaly
    )
    
    post_state = {
        "health_score": post_health,
        "anomaly_score": post_anomaly,
        "severity": post_severity,
        "incident_type": incident_type
    }
    
    health_delta = post_health - pre_health
    anomaly_delta = post_anomaly - pre_anomaly
    severity_changed = post_severity != pre_severity
    
    changes = {
        "health_score_delta": health_delta,
        "anomaly_score_delta": anomaly_delta,
        "severity_changed": severity_changed
    }
    
    evidence = []
    
    if health_delta > 0:
        evidence.append(f"Health score improved from {pre_health} to {post_health} (+{health_delta}).")
    elif health_delta < 0:
        evidence.append(f"Health score worsened from {pre_health} to {post_health} ({health_delta}).")
    else:
        evidence.append(f"Health score remained unchanged at {pre_health}.")
        
    if anomaly_delta < 0:
        evidence.append(f"Anomaly score decreased from {pre_anomaly} to {post_anomaly} ({anomaly_delta}).")
    elif anomaly_delta > 0:
        evidence.append(f"Anomaly score increased from {pre_anomaly} to {post_anomaly} (+{anomaly_delta}).")
    else:
        evidence.append(f"Anomaly score remained unchanged at {pre_anomaly}.")
        
    if severity_changed:
        evidence.append(f"Severity improved from {pre_severity} to {post_severity}.")
    else:
        evidence.append(f"Severity remained {pre_severity}.")
        
    # Classification Logic
    if (health_delta >= 60 or (post_health >= 90 and post_severity == "NORMAL")):
        recovery_status = "recovered"
        summary = "Recovery is classified as complete because health and severity normalized."
    elif health_delta > 10 and post_severity != "CRITICAL":
        recovery_status = "partially_recovered"
        summary = f"Recovery is classified as partial because severity remains {post_severity}."
    else:
        recovery_status = "not_recovered"
        summary = "Recovery is classified as not recovered due to negligible improvement or remaining CRITICAL severity."
        
    evidence.append(summary)
    
    # Calculate recovery_score (0-100) based on deltas
    # health delta max is roughly 100. anomaly delta min is roughly -100.
    # Score combines the two bounded between 0-100
    score_from_health = max(0, min(100, health_delta))
    score_from_anomaly = max(0, min(100, -anomaly_delta))
    recovery_score = int((score_from_health + score_from_anomaly) / 2)
    
    # If final health is 100, recovery score should be 100.
    if post_health == 100:
        recovery_score = 100
    
    # Confidence is capped as it is a simulation
    verification_confidence = 85

    result["recovery_verification"] = {
        "verification_id": verification_id,
        "status": recovery_status,
        "mode": "simulated",
        "pre_remediation_state": pre_state,
        "post_remediation_state": post_state,
        "changes": changes,
        "recovery_score": recovery_score,
        "evidence": evidence,
        "verification_summary": summary,
        "verification_confidence": verification_confidence
    }
    
    return result, "completed"

def _simulate_post_state(incident_type: str, solution_id: str, pre_health: int, pre_anomaly: int):
    """Deterministically maps pre-states to a bounded post-state."""
    # Deterministic hash to seed improvement factor (e.g. string lengths)
    seed = len(incident_type) + len(solution_id)
    
    # Generate an improvement factor between 0.3 and 0.9 based on seed
    factor = 0.3 + ((seed % 7) * 0.1) 
    
    # Rare case where factor might perfectly resolve
    if (seed % 10) == 0:
        factor = 1.0
        
    # Calculate new values
    health_space = 100 - pre_health
    post_health = pre_health + int(health_space * factor)
    
    post_anomaly = pre_anomaly - int(pre_anomaly * factor)
    
    # Dynamically determine severity based on anomaly
    if post_anomaly > 75:
        post_severity = "CRITICAL"
    elif post_anomaly > 40:
        post_severity = "WARNING"
    else:
        post_severity = "NORMAL"
        
    # If it happens to be heavily improved, cap it perfectly
    if factor >= 0.9:
        post_health = 100
        post_anomaly = 0
        post_severity = "NORMAL"
        
    return post_health, post_anomaly, post_severity
    

def _apply_skipped(result: Dict[str, Any], verification_id: str, reason: str) -> tuple[Dict[str, Any], str]:
    """Generates a not_verified block."""
    final_result = dict(result)
    
    remediation_block = result.get("remediation", {})
    pre_state = remediation_block.get("pre_remediation_state", {})
    
    final_result["recovery_verification"] = {
        "verification_id": verification_id,
        "status": "not_verified",
        "mode": "simulated",
        "pre_remediation_state": pre_state,
        "post_remediation_state": {},
        "changes": {
            "health_score_delta": 0,
            "anomaly_score_delta": 0,
            "severity_changed": False
        },
        "recovery_score": 0,
        "evidence": [],
        "verification_summary": reason,
        "verification_confidence": 0
    }
    return final_result, "skipped"
