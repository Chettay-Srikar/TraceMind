import os
import json
import urllib.request
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from pathlib import Path

# Ensure .env is loaded (if not already loaded by main)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Validates the Supabase JWT by sending it to the Supabase Auth API.
    Returns the authenticated user's ID.
    Raises an HTTP 401 Unauthorized if the token is invalid.
    """
    token = credentials.credentials
    supabase_url = os.getenv("VITE_SUPABASE_URL", "").strip()
    supabase_key = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY", "").strip()
    
    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server is missing Supabase configuration."
        )

    # Supabase user endpoint
    req_url = f"{supabase_url.rstrip('/')}/auth/v1/user"
    req = urllib.request.Request(req_url)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("apikey", supabase_key)
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status != 200:
                raise Exception("Non-200 response")
            user_data = json.loads(response.read().decode())
            user_id = user_data.get("id")
            if not user_id:
                raise Exception("User ID not found in response")
            return user_id
    except Exception as e:
        # Invalid token or network error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Optional auth dependency for routes where authentication might be optional
# (Though in our case, we will enforce it strictly for the dashboard)
def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[str]:
    if credentials:
        try:
            return get_current_user(credentials)
        except HTTPException:
            return None
    return None
