import os
from unittest.mock import patch, MagicMock
os.environ["VITE_SUPABASE_URL"] = "http://test"
os.environ["VITE_SUPABASE_PUBLISHABLE_KEY"] = "test"
os.environ["MONGODB_URI"] = "mongodb://localhost:27017"

with patch("backend.database.test_connection", return_value=True):
    with patch("backend.database.get_logs_collection") as mock_get_col:
        mock_col.return_value = MagicMock()
        from backend.main import app

from fastapi.testclient import TestClient
client = TestClient(app)

def mock_urlopen(*args, **kwargs):
    cm = MagicMock()
    rm = MagicMock()
    rm.status = 200
    rm.read.return_value = b'{"id": "test_user"}'
    cm.__enter__.return_value = rm
    return cm

with patch("urllib.request.urlopen", side_effect=mock_urlopen):
    response = client.post(
        '/logs/import', 
        headers={'Authorization': 'Bearer test'}, 
        files={'file': ('test.json', '[{"timestamp": "t1", "service": "s1", "level": "INFO", "message": "m1"}]', 'application/json')}
    )
    print(response.status_code)
    print(response.json())
