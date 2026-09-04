from typing import Dict, Any

def rank_solutions(final_result: Dict[str, Any]) -> tuple[Dict[str, Any], str]:
    """
    Deterministically ranks the candidate solutions generated in Step 4.
    Returns (result_with_recommendation, status).
    """
    result = dict(final_result)
    
    intel = result.get("solution_intelligence", {})
    solutions = intel.get("solutions", [])
    
    if not solutions or result.get("incident", {}).get("incident_type", "normal") == "normal":
        return _apply_fallback(result, "No valid candidate solutions to rank.")
        
    ai_inv = result.get("ai_investigation", {})
    root_cause_confidence = ai_inv.get("root_cause_confidence", result.get("confidence", 50))
    
    ranked_candidates = []
    
    for sol in solutions:
        score_details = _calculate_score(sol)
        # Final score discounted by root cause confidence (if root cause is 50% certain, max score is ~50)
        # We apply a slight buffer so it doesn't completely crush good solutions for moderate confidence.
        discount_factor = (root_cause_confidence / 100.0)
        final_score = int(score_details["raw_score"] * (0.5 + 0.5 * discount_factor))
        
        # Ensure bounds 0-100
        final_score = max(0, min(100, final_score))
        
        ranked_candidates.append({
            "solution_id": sol.get("solution_id", "unknown"),
            "recommendation_score": final_score,
            "title": sol.get("title", "Unknown"),
            "reason": _generate_reason(sol, final_score, score_details),
            "strengths": score_details["strengths"],
            "tradeoffs": sol.get("tradeoffs", []),
            "confidence": int(sol.get("confidence", 0) * discount_factor)
        })
        
    # Sort descending by score, then alphabetically by title to guarantee determinism on ties
    ranked_candidates.sort(key=lambda x: (-x["recommendation_score"], x["title"]))
    
    # Assign ranks
    for i, candidate in enumerate(ranked_candidates):
        candidate["rank"] = i + 1
        
    result["recommendation"] = {
        "recommendations": ranked_candidates,
        "selected_recommendation": ranked_candidates[0] if ranked_candidates else {},
        "ranking_method": {
            "evidence_fit_weight": 0.30,
            "confidence_weight": 0.25,
            "complexity_weight": -0.15,
            "risk_weight_map": {"low": 10, "medium": 0, "high": -10},
            "effort_weight_map": {"low": 10, "medium": 0, "high": -10}
        },
        "recommendation_status": "complete"
    }
    
    return result, "connected"

def _calculate_score(solution: Dict[str, Any]) -> Dict[str, Any]:
    """
    Applies the deterministic weighting formula to a single solution.
    Base score is 50.
    """
    evidence_fit = solution.get("evidence_fit", 50)
    confidence = solution.get("confidence", 50)
    complexity = solution.get("implementation_complexity", 50)
    risk = solution.get("risk", "medium").lower()
    effort = solution.get("effort", "medium").lower()
    
    # Base score
    score = 50.0
    
    # Evidence Fit (+ up to 15, - up to 15) -> 30% relative spread
    score += (evidence_fit - 50) * 0.30
    
    # Confidence (+ up to 12.5, - up to 12.5) -> 25% relative spread
    score += (confidence - 50) * 0.25
    
    # Complexity (Lower is better. + up to 7.5, - up to 7.5) -> 15% relative spread
    score += (50 - complexity) * 0.15
    
    # Risk
    if risk == "low":
        score += 10
    elif risk == "high":
        score -= 10
        
    # Effort
    if effort == "low":
        score += 10
    elif effort == "high":
        score -= 10
        
    strengths = []
    if evidence_fit > 80: strengths.append("Strong evidence alignment")
    if confidence > 80: strengths.append("High confidence of success")
    if complexity < 30: strengths.append("Simple to implement")
    if risk == "low": strengths.append("Low operational risk")
    if effort == "low": strengths.append("Low engineering effort")
    
    return {
        "raw_score": score,
        "strengths": strengths
    }

def _generate_reason(solution: Dict[str, Any], final_score: int, score_details: Dict[str, Any]) -> str:
    """Generates an explainable reason for the score."""
    strengths = score_details["strengths"]
    base = f"Scored {final_score}/100."
    if strengths:
        base += f" Chosen for: {', '.join(strengths)}."
    
    if solution.get("risk") == "high":
        base += " Note: Carries high operational risk."
        
    return base

def _apply_fallback(result: Dict[str, Any], reason: str) -> tuple[Dict[str, Any], str]:
    """Generates a safe fallback when no solutions can be ranked."""
    final_result = dict(result)
    
    final_result["recommendation"] = {
        "recommendations": [],
        "selected_recommendation": {},
        "ranking_method": {},
        "recommendation_status": "fallback",
        "reason": reason
    }
    return final_result, "unavailable"
