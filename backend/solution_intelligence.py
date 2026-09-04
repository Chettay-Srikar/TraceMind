import json
import uuid
from typing import Dict, Any
from backend.featherless_client import run_investigation

def generate_solutions(enhanced_result: Dict[str, Any]) -> tuple[Dict[str, Any], str]:
    """
    Takes the structured deterministic result (which includes the correlated incident and AI investigation)
    and uses the AI to generate multiple candidate remediation solutions.
    """
    incident = enhanced_result.get("incident", {})
    ai_inv = enhanced_result.get("ai_investigation", {})
    
    # Check if there is a real incident to solve
    if incident.get("incident_type", "normal") == "normal":
        return _apply_fallback(enhanced_result, "System is operating normally. No remediation needed.")

    prompt = _construct_prompt(enhanced_result)
    
    # Communicate with AI
    ai_response, ai_status = run_investigation(prompt)
    
    if ai_status == "unavailable" or not ai_response:
        return _apply_fallback(enhanced_result, "AI unavailable or request failed.")
        
    # Validate the AI response
    if not _validate_ai_response(ai_response):
        return _apply_fallback(enhanced_result, "AI returned invalid or hallucinated data.")
        
    # Apply successful investigation
    final_result = dict(enhanced_result)
    ai_response["intelligence_status"] = "complete"
    final_result["solution_intelligence"] = ai_response
    
    return final_result, "connected"

def _construct_prompt(enhanced_result: Dict[str, Any]) -> str:
    incident = enhanced_result.get("incident", {})
    ai_inv = enhanced_result.get("ai_investigation", {})
    
    return f"""You are a Solution Intelligence engine for TraceMind.
Your task is to propose at least 3 distinct, practical remediation solutions for the following incident.
Do NOT invent external research, fabricated URLs, or unverified claims.
Only base your solutions on the observed telemetry, the root cause, and standard engineering best practices.

Incident Type: {incident.get("incident_type")}
Severity: {incident.get("severity")}
Affected Services: {json.dumps(incident.get("affected_services", []))}
Root Cause: {ai_inv.get("root_cause", enhanced_result.get("root_cause"))}
Confidence: {ai_inv.get("root_cause_confidence", enhanced_result.get("confidence", 50))}
Trigger Event: {json.dumps(incident.get("trigger_event", {}))}
Peak Event: {json.dumps(incident.get("peak_event", {}))}
Uncertainties: {json.dumps(ai_inv.get("uncertainties", []))}

Return exactly and ONLY a valid JSON object matching this schema:
{{
  "solutions": [
    {{
      "solution_id": "solution_1",
      "title": "Short title of the solution",
      "description": "Detailed explanation of what to do",
      "why_it_fits": "Explanation of why this fits the observed evidence",
      "expected_impact": "What this will fix",
      "risk": "low|medium|high",
      "effort": "low|medium|high",
      "evidence_fit": 0, // integer 0-100
      "implementation_complexity": 0, // integer 0-100
      "confidence": 0, // integer 0-100
      "tradeoffs": ["list of tradeoffs"],
      "prerequisites": ["list of prerequisites"],
      "research_basis": ["internal_reasoning", "telemetry_evidence", "incident_pattern"]
    }}
  ],
  "solution_count": 3
}}
"""

def _validate_ai_response(ai_response: Dict[str, Any]) -> bool:
    """Validates that the AI response matches the schema."""
    if "solutions" not in ai_response or "solution_count" not in ai_response:
        return False
        
    if not isinstance(ai_response["solutions"], list):
        return False
        
    if len(ai_response["solutions"]) < 1:
        return False
        
    for sol in ai_response["solutions"]:
        for key in ["solution_id", "title", "description", "why_it_fits", "expected_impact", "risk", "effort", "evidence_fit", "implementation_complexity", "confidence", "tradeoffs", "prerequisites", "research_basis"]:
            if key not in sol:
                return False
                
        if not isinstance(sol["evidence_fit"], (int, float)) or not (0 <= sol["evidence_fit"] <= 100):
            return False
        if not isinstance(sol["implementation_complexity"], (int, float)) or not (0 <= sol["implementation_complexity"] <= 100):
            return False
        if not isinstance(sol["confidence"], (int, float)) or not (0 <= sol["confidence"] <= 100):
            return False
            
        if sol["risk"] not in ["low", "medium", "high"]:
            return False
        if sol["effort"] not in ["low", "medium", "high"]:
            return False
            
        # Prevent URL hallucinations
        for basis in sol["research_basis"]:
            if "http" in basis or "www" in basis or ".com" in basis:
                return False
                
    return True

def _apply_fallback(enhanced_result: Dict[str, Any], reason: str) -> tuple[Dict[str, Any], str]:
    """Generates a deterministic fallback solution block."""
    final_result = dict(enhanced_result)
    incident_type = enhanced_result.get("incident", {}).get("incident_type", "normal")
    
    fallback_map = {
        "database failure": [
            {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Increase Connection Limits",
                "description": "Increase the maximum connection pool size on the database and service sides.",
                "why_it_fits": "Directly addresses database latency and errors seen in telemetry.",
                "expected_impact": "Alleviates connection exhaustion.",
                "risk": "medium",
                "effort": "low",
                "evidence_fit": 80,
                "implementation_complexity": 20,
                "confidence": 75,
                "tradeoffs": ["May increase memory usage on DB host."],
                "prerequisites": ["Database restart or config reload."],
                "research_basis": ["internal_reasoning", "incident_pattern"]
            },
            {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Implement Circuit Breaking",
                "description": "Add circuit breakers to downstream services connecting to the DB.",
                "why_it_fits": "Prevents cascading failure from database to the API gateway.",
                "expected_impact": "Isolates failures and allows graceful degradation.",
                "risk": "low",
                "effort": "high",
                "evidence_fit": 90,
                "implementation_complexity": 80,
                "confidence": 95,
                "tradeoffs": ["Increases code complexity.", "May drop requests temporarily."],
                "prerequisites": ["Circuit breaker library (e.g., resilience4j)."],
                "research_basis": ["internal_reasoning", "telemetry_evidence"]
            },
            {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Query Optimization",
                "description": "Identify and optimize the queries causing latency spikes.",
                "why_it_fits": "Addresses the root trigger event: increasing query latency.",
                "expected_impact": "Reduces load and prevents future connection saturation.",
                "risk": "medium",
                "effort": "medium",
                "evidence_fit": 85,
                "implementation_complexity": 60,
                "confidence": 80,
                "tradeoffs": ["Requires developer time to profile queries."],
                "prerequisites": ["Database query logs enabled."],
                "research_basis": ["internal_reasoning", "incident_pattern"]
            }
        ],
        "api timeout": [
            {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Increase Gateway Timeouts",
                "description": "Temporarily increase API Gateway proxy timeouts.",
                "why_it_fits": "Mitigates 504 Gateway Timeout errors.",
                "expected_impact": "Reduces dropped requests.",
                "risk": "medium",
                "effort": "low",
                "evidence_fit": 70,
                "implementation_complexity": 10,
                "confidence": 60,
                "tradeoffs": ["Ties up gateway connections longer."],
                "prerequisites": [],
                "research_basis": ["internal_reasoning"]
            },
            {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Scale Upstream Service",
                "description": "Add more instances of the upstream service taking too long.",
                "why_it_fits": "Improves overall throughput and lowers latency.",
                "expected_impact": "Restores normal API response times.",
                "risk": "low",
                "effort": "medium",
                "evidence_fit": 85,
                "implementation_complexity": 30,
                "confidence": 80,
                "tradeoffs": ["Increased infrastructure costs."],
                "prerequisites": ["Horizontal scaling supported."],
                "research_basis": ["telemetry_evidence"]
            },
            {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Implement API Caching",
                "description": "Cache frequent responses at the API gateway layer.",
                "why_it_fits": "Reduces load on the slow upstream service.",
                "expected_impact": "Drastically lowers latency for cached endpoints.",
                "risk": "medium",
                "effort": "high",
                "evidence_fit": 90,
                "implementation_complexity": 70,
                "confidence": 85,
                "tradeoffs": ["Potential for stale data."],
                "prerequisites": ["Endpoints must be cacheable."],
                "research_basis": ["incident_pattern"]
            }
        ],
        "memory problem": [
            {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Increase Heap Size",
                "description": "Allocate more memory to the affected service container/JVM.",
                "why_it_fits": "Directly mitigates OutOfMemory errors and GC pauses.",
                "expected_impact": "Stabilizes the service quickly.",
                "risk": "low",
                "effort": "low",
                "evidence_fit": 95,
                "implementation_complexity": 10,
                "confidence": 90,
                "tradeoffs": ["May only delay a memory leak rather than fix it."],
                "prerequisites": ["Available host memory."],
                "research_basis": ["telemetry_evidence"]
            },
            {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Profile Memory Usage",
                "description": "Take a heap dump and analyze for memory leaks.",
                "why_it_fits": "Finds the root cause of the memory pressure.",
                "expected_impact": "Permanent fix for memory growth.",
                "risk": "low",
                "effort": "high",
                "evidence_fit": 100,
                "implementation_complexity": 80,
                "confidence": 95,
                "tradeoffs": ["Taking a heap dump may freeze the process momentarily."],
                "prerequisites": ["Profiling tools available."],
                "research_basis": ["internal_reasoning"]
            },
            {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Restart Service Instances",
                "description": "Perform a rolling restart of the affected service instances.",
                "why_it_fits": "Clears memory temporarily to restore service.",
                "expected_impact": "Immediate, but temporary, relief.",
                "risk": "medium",
                "effort": "low",
                "evidence_fit": 60,
                "implementation_complexity": 15,
                "confidence": 100,
                "tradeoffs": ["Does not fix the underlying issue.", "Temporary drop in capacity."],
                "prerequisites": ["Redundant instances available for rolling restart."],
                "research_basis": ["incident_pattern"]
            }
        ],
        "network problem": [
             {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Verify Network Policies",
                "description": "Check firewall, security groups, and network policies between services.",
                "why_it_fits": "Addresses 'connection refused' and latency spikes.",
                "expected_impact": "Restores connectivity.",
                "risk": "low",
                "effort": "medium",
                "evidence_fit": 90,
                "implementation_complexity": 40,
                "confidence": 85,
                "tradeoffs": [],
                "prerequisites": ["Access to network configuration."],
                "research_basis": ["internal_reasoning", "telemetry_evidence"]
            },
            {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Restart Affected Pods/Containers",
                "description": "Restart containers to reset network interfaces and DNS caches.",
                "why_it_fits": "Often resolves transient networking glitches.",
                "expected_impact": "Quick connectivity restoration.",
                "risk": "low",
                "effort": "low",
                "evidence_fit": 70,
                "implementation_complexity": 10,
                "confidence": 75,
                "tradeoffs": ["May cause brief downtime if not rolling."],
                "prerequisites": [],
                "research_basis": ["incident_pattern"]
            },
            {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Implement Exponential Backoff",
                "description": "Add retry logic with exponential backoff for network calls.",
                "why_it_fits": "Prevents overwhelming a recovering service.",
                "expected_impact": "Increases overall system resilience to network blips.",
                "risk": "low",
                "effort": "high",
                "evidence_fit": 80,
                "implementation_complexity": 75,
                "confidence": 90,
                "tradeoffs": ["Requires code changes."],
                "prerequisites": [],
                "research_basis": ["internal_reasoning"]
            }
        ],
        "cpu overload": [
             {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Horizontal Pod Autoscaling",
                "description": "Enable or configure HPA to scale out on high CPU.",
                "why_it_fits": "Addresses CPU saturation by distributing load.",
                "expected_impact": "Maintains performance during traffic spikes.",
                "risk": "low",
                "effort": "medium",
                "evidence_fit": 95,
                "implementation_complexity": 50,
                "confidence": 90,
                "tradeoffs": ["Higher infrastructure costs during spikes."],
                "prerequisites": ["HPA supported in cluster."],
                "research_basis": ["telemetry_evidence"]
            },
            {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Rate Limiting",
                "description": "Implement rate limiting at the API Gateway.",
                "why_it_fits": "Prevents CPU overload from excessive requests.",
                "expected_impact": "Protects downstream services from crashing.",
                "risk": "medium",
                "effort": "medium",
                "evidence_fit": 85,
                "implementation_complexity": 60,
                "confidence": 85,
                "tradeoffs": ["Legitimate users might be throttled during peak load."],
                "prerequisites": ["Gateway supports rate limiting."],
                "research_basis": ["incident_pattern"]
            },
            {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Optimize CPU-Bound Logic",
                "description": "Profile and optimize the code consuming CPU.",
                "why_it_fits": "Addresses the root cause permanently.",
                "expected_impact": "Lower baseline CPU usage.",
                "risk": "medium",
                "effort": "high",
                "evidence_fit": 100,
                "implementation_complexity": 90,
                "confidence": 95,
                "tradeoffs": ["Requires significant engineering time."],
                "prerequisites": ["CPU profiler."],
                "research_basis": ["internal_reasoning"]
            }
        ]
    }
    
    # Select fallback based on incident type, or a generic fallback if unknown
    solutions = fallback_map.get(incident_type, [])
    
    # Generic fallback if no solutions mapped
    if not solutions and incident_type != "normal":
        solutions = [
             {
                "solution_id": f"sol-{str(uuid.uuid4())[:8]}",
                "title": "Investigate Logs",
                "description": "Manually inspect the logs for errors.",
                "why_it_fits": "General troubleshooting step.",
                "expected_impact": "Information gathering.",
                "risk": "low",
                "effort": "medium",
                "evidence_fit": 50,
                "implementation_complexity": 10,
                "confidence": 50,
                "tradeoffs": [],
                "prerequisites": [],
                "research_basis": ["internal_reasoning"]
            }
        ]
        
    final_result["solution_intelligence"] = {
        "solutions": solutions,
        "solution_count": len(solutions),
        "intelligence_status": "fallback",
        "reason": reason
    }
    
    return final_result, "unavailable"
