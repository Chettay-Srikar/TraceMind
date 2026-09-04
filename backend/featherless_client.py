import os
import json
import logging
import re
from openai import OpenAI

logger = logging.getLogger(__name__)

def enhance_analysis(deterministic_result, logs_context):
    api_key = os.getenv("FEATHERLESS_API_KEY")
    if not api_key:
        logger.warning("FEATHERLESS_API_KEY not found. Falling back to deterministic analysis.")
        return deterministic_result, "unavailable"

    try:
        client = OpenAI(
            base_url="https://api.featherless.ai/v1",
            api_key=api_key,
            timeout=15.0 # 15 seconds timeout
        )
        
        severity = deterministic_result.get("severity")
        incident = deterministic_result.get("incident_type")
        evidence = deterministic_result.get("evidence", [])
        metrics = deterministic_result.get("metrics", {})
        
        prompt = f"""You are an incident-analysis assistant for SentinelAI.
Do not invent facts. Base conclusions only on the supplied deterministic metrics and evidence.
Treat deterministic severity and anomaly scores as authoritative.
Do not expose secrets or credentials.

Incident Type: {incident}
Severity: {severity}
Metrics: {json.dumps(metrics)}
Evidence: {json.dumps(evidence)}

Analyze this data. Provide a practical explanation of the likely root cause and recommend practical remediation.
Keep the response concise and suitable for a monitoring dashboard.

Return exactly and ONLY a valid JSON object with this structure:
{{
  "root_cause": "your root cause here",
  "recommended_action": "your recommendation here",
  "explanation": "your brief explanation here"
}}
"""

        response = client.chat.completions.create(
            model="unsloth/Llama-3.3-70B-Instruct",
            messages=[
                {"role": "system", "content": "You are a precise technical incident response AI. Return ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )
        
        content = response.choices[0].message.content
        
        # Robust JSON extraction
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            ai_data = json.loads(json_match.group(0))
        else:
            ai_data = json.loads(content)
            
        enhanced = dict(deterministic_result)
        enhanced["root_cause"] = ai_data.get("root_cause", deterministic_result.get("root_cause"))
        enhanced["recommended_action"] = ai_data.get("recommended_action", deterministic_result.get("recommended_action"))
        enhanced["explanation"] = ai_data.get("explanation", "AI analysis complete.")
        
        return enhanced, "connected"
        
    except Exception as e:
        logger.error(f"Featherless AI error: {e}")
        return deterministic_result, "unavailable"
