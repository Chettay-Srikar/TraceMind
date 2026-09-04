import json
from typing import Dict, Any, List
from backend.featherless_client import run_investigation

def investigate_incident(deterministic_result: Dict[str, Any]) -> tuple[Dict[str, Any], str]:
    """
    Takes the structured deterministic result (which includes the correlated incident)
    and uses the AI to perform a deeper investigation.
    Returns (enhanced_result, ai_status).
    """
    incident = deterministic_result.get("incident", {})
    
    # Check if there is a real incident to investigate
    if incident.get("incident_type", "normal") == "normal":
        return _apply_fallback(deterministic_result, "System is operating normally. No incident detected.")
        
    prompt = _construct_prompt(deterministic_result)
    
    # Communicate with AI
    ai_response, ai_status = run_investigation(prompt)
    
    if ai_status == "unavailable" or not ai_response:
        return _apply_fallback(deterministic_result, "AI unavailable or request failed.")
        
    # Validate the AI response
    if not _validate_ai_response(ai_response, incident):
        return _apply_fallback(deterministic_result, "AI returned invalid or hallucinated data.")
        
    # Apply successful investigation
    enhanced_result = dict(deterministic_result)
    ai_response["investigation_status"] = "complete"
    enhanced_result["ai_investigation"] = ai_response
    
    # Overwrite the top level backwards-compatible fields
    enhanced_result["root_cause"] = ai_response.get("root_cause", enhanced_result.get("root_cause"))
    enhanced_result["explanation"] = ai_response.get("investigation_summary", "AI investigation complete.")
    # existing recommended_action and evidence are kept as is
    
    return enhanced_result, "connected"

def _construct_prompt(deterministic_result: Dict[str, Any]) -> str:
    incident = deterministic_result.get("incident", {})
    metrics = deterministic_result.get("metrics", {})
    evidence = deterministic_result.get("evidence", [])
    
    return f"""You are an incident-analysis assistant for TraceMind.
Your task is to investigate the provided correlated incident and produce a grounded root-cause analysis.
Do NOT invent services, metrics, timestamps, infrastructure, incidents, or external events.
Base your conclusions ONLY on the provided telemetry timeline and metrics.
If the evidence is insufficient to be certain, list the uncertainty explicitly.

Incident ID: {incident.get("incident_id")}
Incident Type: {incident.get("incident_type")}
Severity: {incident.get("severity")}
Correlation Score: {incident.get("correlation_score")}
Status: {incident.get("status")}
Affected Services: {json.dumps(incident.get("affected_services", []))}
Metrics: {json.dumps(metrics)}
Deterministic Evidence: {json.dumps(evidence)}

Timeline of events:
{json.dumps(incident.get("timeline", []), indent=2)}

Return exactly and ONLY a valid JSON object matching this schema:
{{
  "root_cause": "The most likely underlying cause",
  "root_cause_confidence": 0, // integer from 0 to 100
  "evidence": [
    {{
      "timestamp": "match exact timestamp from timeline",
      "service": "service name",
      "level": "log level",
      "observation": "Why this log supports the root cause",
      "supports_root_cause": true
    }}
  ],
  "investigation_summary": "trigger -> degradation -> downstream impact -> peak failure summary",
  "uncertainties": ["list of uncertainties, or empty array"]
}}
"""

def _validate_ai_response(ai_response: Dict[str, Any], incident: Dict[str, Any]) -> bool:
    """Validates that the AI response matches the schema and doesn't hallucinate."""
    required_keys = ["root_cause", "root_cause_confidence", "evidence", "investigation_summary", "uncertainties"]
    for key in required_keys:
        if key not in ai_response:
            return False
            
    conf = ai_response["root_cause_confidence"]
    if not isinstance(conf, (int, float)) or not (0 <= conf <= 100):
        return False
        
    if not isinstance(ai_response["evidence"], list):
        return False
        
    timeline_timestamps = set(log.get("timestamp") for log in incident.get("timeline", []))
    
    for ev in ai_response["evidence"]:
        if not all(k in ev for k in ["timestamp", "service", "level", "observation", "supports_root_cause"]):
            return False
        # Check against hallucinations
        if ev["timestamp"] not in timeline_timestamps:
            return False
            
    if not isinstance(ai_response["uncertainties"], list):
        return False
        
    return True

def _apply_fallback(deterministic_result: Dict[str, Any], reason: str) -> tuple[Dict[str, Any], str]:
    """Generates a deterministic fallback investigation."""
    enhanced_result = dict(deterministic_result)
    
    incident = deterministic_result.get("incident", {})
    timeline = incident.get("timeline", [])
    
    fallback_evidence = []
    if timeline:
        # Use peak event and trigger event as basic evidence
        if incident.get("trigger_event"):
            trig = incident["trigger_event"]
            fallback_evidence.append({
                "timestamp": trig.get("timestamp"),
                "service": trig.get("service"),
                "level": trig.get("level"),
                "observation": "Trigger event detected.",
                "supports_root_cause": True
            })
        if incident.get("peak_event") and incident.get("peak_event") != incident.get("trigger_event"):
            peak = incident["peak_event"]
            fallback_evidence.append({
                "timestamp": peak.get("timestamp"),
                "service": peak.get("service"),
                "level": peak.get("level"),
                "observation": "Peak severity event detected.",
                "supports_root_cause": True
            })
            
    enhanced_result["ai_investigation"] = {
        "root_cause": deterministic_result.get("root_cause", "Unknown"),
        "root_cause_confidence": deterministic_result.get("confidence", 50),
        "evidence": fallback_evidence,
        "investigation_summary": f"Deterministic Fallback: {deterministic_result.get('incident_type', 'normal')}. {reason}",
        "uncertainties": [reason],
        "investigation_status": "fallback"
    }
    
    return enhanced_result, "unavailable"
