import os
import json
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Set env vars for tests BEFORE importing app
os.environ["VITE_SUPABASE_URL"] = "http://test-supabase-url"
os.environ["VITE_SUPABASE_PUBLISHABLE_KEY"] = "test-key"
os.environ["MONGODB_URI"] = "mongodb://localhost:27017"
os.environ["FEATHERLESS_API_KEY"] = "test"

# Mock the database connection early
with patch("backend.database.test_connection", return_value=True):
    with patch("backend.database.get_logs_collection") as mock_get_collection:
        mock_collection = MagicMock()
        mock_collection.count_documents.return_value = 0
        mock_get_collection.return_value = mock_collection
        from backend.main import app

client = TestClient(app)

# Mock urllib.request.urlopen to bypass actual Supabase token check
def mock_urlopen(*args, **kwargs):
    cm = MagicMock()
    response_mock = MagicMock()
    response_mock.status = 200
    response_mock.read.return_value = b'{"id": "test_user_123"}'
    cm.__enter__.return_value = response_mock
    return cm

@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer test_token"}

@patch("urllib.request.urlopen", side_effect=mock_urlopen)
def test_import_json(mock_urllib, auth_headers):
    # Valid JSON
    data = [{"timestamp": "2026-09-05T00:00:00Z", "service": "auth", "level": "INFO", "message": "Login success"}]
    files = {"file": ("test.json", json.dumps(data), "application/json")}
    
    with patch("backend.main.get_logs_collection") as mock_get_col:
        mock_col = MagicMock()
        mock_get_col.return_value = mock_col
        response = client.post("/logs/import", headers=auth_headers, files=files)
        
        assert response.status_code == 200
        assert response.json()["imported_count"] == 1
        
        # Verify user_id was injected
        mock_col.insert_many.assert_called_once()
        inserted_docs = mock_col.insert_many.call_args[0][0]
        assert inserted_docs[0]["user_id"] == "test_user_123"

@patch("urllib.request.urlopen", side_effect=mock_urlopen)
def test_import_csv(mock_urllib, auth_headers):
    # Valid CSV
    csv_data = "timestamp,service,level,message\n2026-09-05T00:00:00Z,db,ERROR,Connection lost"
    files = {"file": ("test.csv", csv_data, "text/csv")}
    
    with patch("backend.main.get_logs_collection") as mock_get_col:
        mock_col = MagicMock()
        mock_get_col.return_value = mock_col
        response = client.post("/logs/import", headers=auth_headers, files=files)
        
        assert response.status_code == 200
        assert response.json()["imported_count"] == 1
        inserted_docs = mock_col.insert_many.call_args[0][0]
        assert inserted_docs[0]["user_id"] == "test_user_123"

@patch("urllib.request.urlopen", side_effect=mock_urlopen)
def test_import_jsonl(mock_urllib, auth_headers):
    # Valid JSONL
    jsonl_data = '{"timestamp": "t1", "service": "s1", "level": "INFO", "message": "m1"}\n{"timestamp": "t2", "service": "s2", "level": "WARN", "message": "m2"}'
    files = {"file": ("test.jsonl", jsonl_data, "application/jsonl")}
    
    with patch("backend.main.get_logs_collection") as mock_get_col:
        mock_col = MagicMock()
        mock_get_col.return_value = mock_col
        response = client.post("/logs/import", headers=auth_headers, files=files)
        
        assert response.status_code == 200
        assert response.json()["imported_count"] == 2
        inserted_docs = mock_col.insert_many.call_args[0][0]
        assert inserted_docs[0]["user_id"] == "test_user_123"
        assert inserted_docs[1]["user_id"] == "test_user_123"

@patch("urllib.request.urlopen", side_effect=mock_urlopen)
def test_import_missing_fields(mock_urllib, auth_headers):
    # Missing 'service'
    data = [{"timestamp": "t1", "level": "INFO", "message": "m1"}]
    files = {"file": ("test.json", json.dumps(data), "application/json")}
    
    response = client.post("/logs/import", headers=auth_headers, files=files)
    assert response.status_code == 400
    assert "Missing required fields" in response.json()["detail"]

@patch("urllib.request.urlopen", side_effect=mock_urlopen)
def test_import_malformed_json(mock_urllib, auth_headers):
    files = {"file": ("test.json", "{not_json}", "application/json")}
    
    response = client.post("/logs/import", headers=auth_headers, files=files)
    assert response.status_code == 400
    assert "Error parsing file" in response.json()["detail"]

def test_import_unauthorized():
    data = [{"timestamp": "t1", "service": "s1", "level": "INFO", "message": "m1"}]
    files = {"file": ("test.json", json.dumps(data), "application/json")}
    
    response = client.post("/logs/import", files=files)
    # FastAPI HTTPBearer returns 403 when no token is provided
    assert response.status_code == 401

@patch("urllib.request.urlopen", side_effect=mock_urlopen)
def test_analysis_run_success(mock_urllib, auth_headers):
    # Test valid analysis run with logs
    with patch("backend.main.get_logs_collection") as mock_get_col:
        mock_col = MagicMock()
        mock_col.find.return_value.sort.return_value = [
            {"_id": "test_id", "user_id": "test_user_123", "timestamp": "t1", "service": "s1", "level": "ERROR", "message": "m1"}
        ]
        mock_get_col.return_value = mock_col
        
        with patch("backend.main.analyze_logs") as mock_analyze:
            mock_analyze.return_value = {"health_score": 50, "severity": "HIGH"}
            
            with patch("backend.main.investigate_incident") as mock_inv:
                mock_inv.return_value = ({"health_score": 50, "severity": "HIGH"}, "connected")
                
                with patch("backend.main.generate_solutions") as mock_sol:
                    mock_sol.return_value = ({"health_score": 50}, "connected")
                    
                    with patch("backend.main.rank_solutions") as mock_rank:
                        mock_rank.return_value = ({"health_score": 50}, "connected")
                        
                        with patch("backend.main.execute_remediation") as mock_rem:
                            mock_rem.return_value = ({"health_score": 50}, "connected")
                            
                            with patch("backend.main.verify_recovery") as mock_ver:
                                mock_ver.return_value = ({"health_score": 50, "final": True}, "connected")
                                
                                response = client.post("/analysis/run", headers=auth_headers)
                                assert response.status_code == 200
                                assert response.json()["final"] is True
                                assert response.json()["ai_provider"] == "featherless"
                                mock_col.find.assert_called_with({"user_id": "test_user_123"})

@patch("urllib.request.urlopen", side_effect=mock_urlopen)
def test_analysis_run_empty(mock_urllib, auth_headers):
    # Test empty logs returns 400
    with patch("backend.main.get_logs_collection") as mock_get_col:
        mock_col = MagicMock()
        mock_col.find.return_value.sort.return_value = []
        mock_get_col.return_value = mock_col
        
        response = client.post("/analysis/run", headers=auth_headers)
        assert response.status_code == 400
        assert "No telemetry imported" in response.json()["detail"]

def test_analysis_run_unauthorized():
    response = client.post("/analysis/run")
    assert response.status_code in [401, 403]

@patch("urllib.request.urlopen", side_effect=mock_urlopen)
def test_analysis_run_cross_user_isolation(mock_urllib, auth_headers):
    # Test cross-user isolation: user A should not see user B's logs
    with patch("backend.main.get_logs_collection") as mock_get_col:
        mock_col = MagicMock()
        
        # We mock the find method to return only User A's logs if queried for User A
        def mock_find(query):
            cursor = MagicMock()
            if query.get("user_id") == "test_user_123":
                cursor.sort.return_value = [{"_id": "test_id_A", "user_id": "test_user_123", "timestamp": "t1", "service": "s1", "level": "ERROR", "message": "m1"}]
            else:
                cursor.sort.return_value = [{"_id": "test_id_B", "user_id": "user_B", "timestamp": "t2", "service": "s2", "level": "CRITICAL", "message": "m2"}]
            return cursor
            
        mock_col.find.side_effect = mock_find
        mock_get_col.return_value = mock_col
        
        with patch("backend.main.analyze_logs") as mock_analyze:
            mock_analyze.return_value = {"health_score": 50, "severity": "HIGH"}
            
            with patch("backend.main.investigate_incident") as mock_inv:
                mock_inv.return_value = ({"health_score": 50, "severity": "HIGH"}, "connected")
                with patch("backend.main.generate_solutions") as mock_sol:
                    mock_sol.return_value = ({"health_score": 50}, "connected")
                    with patch("backend.main.rank_solutions") as mock_rank:
                        mock_rank.return_value = ({"health_score": 50}, "connected")
                        with patch("backend.main.execute_remediation") as mock_rem:
                            mock_rem.return_value = ({"health_score": 50}, "connected")
                            with patch("backend.main.verify_recovery") as mock_ver:
                                mock_ver.return_value = ({"health_score": 50, "final": True}, "connected")
                                
                                response = client.post("/analysis/run", headers=auth_headers)
                                
                                # Assert exactly User A's logs were passed to analyze_logs
                                mock_col.find.assert_called_with({"user_id": "test_user_123"})
                                called_logs = mock_analyze.call_args[0][0]
                                assert len(called_logs) == 1
                                assert called_logs[0]["user_id"] == "test_user_123"
                                assert called_logs[0]["_id"] == "test_id_A"
