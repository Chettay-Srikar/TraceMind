import datetime
from typing import Dict, Any

def verify_recovery(final_result: Dict[str, Any]) -> tuple[Dict[str, Any], str]:
    """
    Simulates a post-remediation health check to verify recovery.
    Returns (result_with_verification, status).
    """
    result = dict(final_result)
    
    remediation_block = result.get("remediation", {})
    rem_status = remediation_block.get("status", "unknown")
    
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # Check if we should skip verification
    if rem_status in ["skipped", "unknown"]:
        result["recovery_verification"] = {
            "verification_status": "skipped",
            "recovery_status": "not_applicable",
            "timestamp": now_str,
            "pre_remediation_state": remediation_block.get("pre_remediation_state", {}),
            "post_remediation_state": {},
            "verification_log": [f"[{now_str}] Recovery verification skipped because remediation was {rem_status}."]
        }
        return result, "skipped"
        
    pre_state = remediation_block.get("pre_remediation_state", {})
    
    # Simulate a successful post-remediation state
    post_state = {
        "health_score": 100,
        "anomaly_score": 0,
        "severity": "NORMAL",
        "incident_type": "normal"
    }
    
    execution_log = []
    execution_log.append(f"[{now_str}] Started simulated recovery verification for remediation_id: {remediation_block.get('remediation_id')}")
    
    health_improved = post_state["health_score"] > pre_state.get("health_score", 100)
    severity_normal = post_state["severity"] == "NORMAL"
    
    recovery_status = "failed"
    if health_improved and severity_normal:
        recovery_status = "verified"
        execution_log.append(f"[{now_str}] Health score improved from {pre_state.get('health_score')} to 100.")
        execution_log.append(f"[{now_str}] Severity normalized from {pre_state.get('severity')} to NORMAL.")
    elif health_improved:
        recovery_status = "partial"
        execution_log.append(f"[{now_str}] Health score improved, but severity is not NORMAL.")
    else:
        execution_log.append(f"[{now_str}] No significant health improvement detected.")
        
    execution_log.append(f"[{now_str}] Recovery verification complete. Status: {recovery_status}")

    result["recovery_verification"] = {
        "verification_status": "completed",
        "recovery_status": recovery_status,
        "timestamp": now_str,
        "pre_remediation_state": pre_state,
        "post_remediation_state": post_state,
        "verification_log": execution_log
    }
    
    return result, "completed"
