import os
import json
import logging
import re
from openai import OpenAI
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)

def run_investigation(prompt: str) -> Tuple[Dict[str, Any], str]:
    """
    Communicates with Featherless AI to run the investigation prompt.
    Returns (parsed_json_dict, status_string).
    """
    api_key = os.getenv("FEATHERLESS_API_KEY")
    if not api_key:
        logger.warning("FEATHERLESS_API_KEY not found.")
        return {}, "unavailable"

    try:
        client = OpenAI(
            base_url="https://api.featherless.ai/v1",
            api_key=api_key,
            timeout=15.0 # 15 seconds timeout
        )
        
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
            
        return ai_data, "connected"
        
    except Exception as e:
        logger.error(f"Featherless AI error: {e}")
        return {}, "unavailable"
