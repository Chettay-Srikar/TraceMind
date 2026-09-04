import uuid
import datetime
from typing import Dict, Any

def execute_remediation(final_result: Dict[str, Any]) -> tuple[Dict[str, Any], str]:
    """
    Simulates the execution of the selected recommendation from Step 5.
    Returns (result_with_remediation, status).
    """
    result = dict(final_result)
    
    incident = result.get("incident", {})
    recommendation_block = result.get("recommendation", {})
    selected_rec = recommendation_block.get("selected_recommendation", {})
    
    remediation_id = f"rem-{str(uuid.uuid4())[:8]}"
    
    # Check if there is a real incident to solve or a valid recommendation
    if incident.get("incident_type", "normal") == "normal" or not selected_rec:
        return _apply_skipped(result, remediation_id, "No active incident or valid recommendation to remediate.")
        
    solution_id = selected_rec.get("solution_id")
    action_title = selected_rec.get("title", "Unknown Action")
    confidence = selected_rec.get("confidence", 50)
    
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    execution_log = []
    execution_log.append(f"[{now_str}] Started SIMULATED remediation for solution_id: {solution_id}")
    execution_log.append(f"[{now_str}] Target action: {action_title}")
    
    if confidence < 50:
        execution_log.append(f"[{now_str}] WARNING: Executing with low confidence ({confidence}%). Expected effect is uncertain.")
    
    # Generate the simulated changes based on the title/incident type
    simulated_changes = []
    expected_effect = selected_rec.get("expected_impact", "System returns to normal.")
    
    title_lower = action_title.lower()
    if "connection" in title_lower or "pool" in title_lower:
        simulated_changes.append({
            "target": "database_connection_pool",
            "change": "Would apply limit increase from 100 to 500.",
            "expected_effect": expected_effect
        })
    elif "circuit" in title_lower or "retry" in title_lower or "backoff" in title_lower:
        simulated_changes.append({
            "target": "downstream_service_clients",
            "change": "Would apply exponential backoff and circuit breaker thresholds.",
            "expected_effect": expected_effect
        })
    elif "timeout" in title_lower:
        simulated_changes.append({
            "target": "api_gateway_proxy",
            "change": "Would apply timeout increase from 5s to 15s.",
            "expected_effect": expected_effect
        })
    elif "memory" in title_lower or "heap" in title_lower:
        simulated_changes.append({
            "target": "service_jvm_args",
            "change": "Would apply heap size increase (e.g. -Xmx2G to -Xmx4G).",
            "expected_effect": expected_effect
        })
    elif "cpu" in title_lower or "scale" in title_lower or "hpa" in title_lower:
        simulated_changes.append({
            "target": "kubernetes_hpa",
            "change": "Would apply minReplicas increase.",
            "expected_effect": expected_effect
        })
    elif "restart" in title_lower:
        simulated_changes.append({
            "target": "kubernetes_pods",
            "change": "Would apply rolling restart.",
            "expected_effect": expected_effect
        })
    else:
        simulated_changes.append({
            "target": "system_configuration",
            "change": f"Would apply configuration change: {action_title}",
            "expected_effect": expected_effect
        })
        
    execution_log.append(f"[{now_str}] Simulated changes constructed. No real infrastructure was modified.")
    execution_log.append(f"[{now_str}] Remediation simulation complete.")

    result["remediation"] = {
        "remediation_id": remediation_id,
        "solution_id": solution_id,
        "action": action_title,
        "mode": "simulated",
        "status": "completed",
        "started_at": now_str,
        "completed_at": now_str,
        "affected_services": incident.get("affected_services", []),
        "pre_remediation_state": {
            "health_score": result.get("health_score", 0),
            "anomaly_score": result.get("anomaly_score", 0),
            "severity": result.get("severity", "UNKNOWN"),
            "incident_type": incident.get("incident_type", "unknown")
        },
        "simulated_changes": simulated_changes,
        "execution_log": execution_log,
        "error": None
    }
    
    return result, "simulated"

def _apply_skipped(result: Dict[str, Any], remediation_id: str, reason: str) -> tuple[Dict[str, Any], str]:
    """Generates a skipped remediation block when no action should be taken."""
    final_result = dict(result)
    
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    final_result["remediation"] = {
        "remediation_id": remediation_id,
        "solution_id": None,
        "action": None,
        "mode": "simulated",
        "status": "skipped",
        "started_at": now_str,
        "completed_at": now_str,
        "affected_services": [],
        "pre_remediation_state": {
            "health_score": result.get("health_score", 0),
            "anomaly_score": result.get("anomaly_score", 0),
            "severity": result.get("severity", "UNKNOWN"),
            "incident_type": result.get("incident", {}).get("incident_type", "unknown")
        },
        "simulated_changes": [],
        "execution_log": [f"[{now_str}] Remediation skipped: {reason}"],
        "error": reason
    }
    return final_result, "skipped"
