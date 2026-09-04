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
@patch('backend.database.get_analysis_collection')
def test_analysis_run_success(mock_get_analysis_col, mock_urllib, auth_headers):
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
@patch('backend.database.get_analysis_collection')
def test_analysis_run_empty(mock_get_analysis_col, mock_urllib, auth_headers):
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
@patch('backend.database.get_analysis_collection')
def test_analysis_run_cross_user_isolation(mock_get_analysis_col, mock_urllib, auth_headers):
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

@patch("urllib.request.urlopen", side_effect=mock_urlopen)
def test_get_analysis_success(mock_urllib, auth_headers):
    with patch("backend.database.get_analysis_collection") as mock_get_col:
        mock_col = MagicMock()
        mock_col.find_one.return_value = {"_id": "fake_id", "user_id": "test_user_123", "health_score": 50}
        mock_get_col.return_value = mock_col
        
        response = client.get("/analysis", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["health_score"] == 50
        mock_col.find_one.assert_called_with({"user_id": "test_user_123"})

@patch("urllib.request.urlopen", side_effect=mock_urlopen)
def test_get_analysis_not_found(mock_urllib, auth_headers):
    with patch("backend.database.get_analysis_collection") as mock_get_col:
        mock_col = MagicMock()
        mock_col.find_one.return_value = None
        mock_get_col.return_value = mock_col
        
        response = client.get("/analysis", headers=auth_headers)
        assert response.status_code == 404
        assert "No analysis found" in response.json()["detail"]


@patch("urllib.request.urlopen", side_effect=mock_urlopen)
@patch("backend.database.get_analysis_collection")
@patch("backend.main.get_logs_collection")
def test_analysis_run_failed_rerun_safety(mock_get_logs_col, mock_get_analysis_col, mock_urllib, auth_headers):
    # Setup mock collections
    mock_logs_col = MagicMock()
    mock_logs_col.count_documents.return_value = 5
    mock_logs_col.find.return_value.sort.return_value = [{"level": "ERROR", "message": "test"}]
    mock_get_logs_col.return_value = mock_logs_col

    mock_analysis_col = MagicMock()
    mock_get_analysis_col.return_value = mock_analysis_col
    
    # 1. Simulate existing successful analysis
    existing_analysis = {"_id": "fake_id", "user_id": "test_user_123", "health_score": 99}
    mock_analysis_col.find_one.return_value = existing_analysis
    
    # 2. Simulate failed run by mocking the internal pipeline function
    with patch("backend.main._execute_analysis_pipeline") as mock_pipeline:
        mock_pipeline.side_effect = Exception("Pipeline failed")
        
        # We need to catch the exception in test client if it bubbles up
        try:
            response = client.post("/analysis/run", headers=auth_headers)
            assert response.status_code == 500
        except Exception as e:
            assert str(e) == "Pipeline failed"
            
        # 3. Confirm the failed run doesn't delete/replace previous analysis
        mock_analysis_col.update_one.assert_not_called()
        mock_analysis_col.delete_one.assert_not_called()
        
    # 4. Confirm GET /analysis still returns the previous successful result
    get_response = client.get("/analysis", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["health_score"] == 99


@patch("urllib.request.urlopen", side_effect=mock_urlopen)
@patch("backend.database.get_analysis_collection")
@patch("backend.main.get_logs_collection")
def test_analysis_run_persistence_details(mock_get_logs_col, mock_get_analysis_col, mock_urllib, auth_headers):
    # Setup mock collections
    mock_logs_col = MagicMock()
    mock_logs_col.count_documents.return_value = 5
    mock_logs_col.find.return_value.sort.return_value = [{"level": "ERROR", "message": "test"}]
    mock_get_logs_col.return_value = mock_logs_col

    mock_analysis_col = MagicMock()
    mock_get_analysis_col.return_value = mock_analysis_col
    
    # Run successful analysis
    response = client.post("/analysis/run", headers=auth_headers)
    assert response.status_code == 200
    
    # Verify persistence operation details
    mock_analysis_col.update_one.assert_called_once()
    args, kwargs = mock_analysis_col.update_one.call_args
    
    filter_arg = args[0]
    update_arg = args[1]
    
    # Verify filter
    assert filter_arg == {"user_id": "test_user_123"}
    
    # Verify upsert
    assert kwargs.get("upsert") is True
    
    # Verify result contains complete analysis response and user_id
    set_data = update_arg.get("$set", {})
    assert set_data["user_id"] == "test_user_123"
    assert "health_score" in set_data
    assert "ai_investigation" in set_data


@patch("urllib.request.urlopen", side_effect=mock_urlopen)
@patch("backend.database.get_analysis_collection")
@patch("backend.main.get_logs_collection")
def test_analysis_run_rerun_replacement(mock_get_logs_col, mock_get_analysis_col, mock_urllib, auth_headers):
    # Setup mock collections
    mock_logs_col = MagicMock()
    mock_logs_col.count_documents.return_value = 5
    mock_logs_col.find.return_value.sort.return_value = [{"level": "ERROR", "message": "test"}]
    mock_get_logs_col.return_value = mock_logs_col

    mock_analysis_col = MagicMock()
    mock_get_analysis_col.return_value = mock_analysis_col
    
    # First run
    client.post("/analysis/run", headers=auth_headers)
    
    # Second run
    client.post("/analysis/run", headers=auth_headers)
    
    # Verify update_one was called twice, both with upsert=True and same filter
    assert mock_analysis_col.update_one.call_count == 2
    for call in mock_analysis_col.update_one.call_args_list:
        args, kwargs = call
        assert args[0] == {"user_id": "test_user_123"}
        assert kwargs.get("upsert") is True


@patch("urllib.request.urlopen", side_effect=mock_urlopen)
@patch("backend.database.get_analysis_collection")
def test_get_analysis_cross_user_isolation(mock_get_analysis_col, mock_urllib):
    mock_col = MagicMock()
    mock_get_analysis_col.return_value = mock_col
    
    # User A requests analysis
    def mock_find_one(query):
        if query.get("user_id") == "userA":
            return {"_id": "idA", "user_id": "userA", "health_score": 50}
        if query.get("user_id") == "test_user_123":
            return {"_id": "idB", "user_id": "test_user_123", "health_score": 90}
        return None
        
    mock_col.find_one.side_effect = mock_find_one
    
    # GET as User A (Requires overriding the dependency in test client for a different user)
    # The default auth_headers fixture uses "test_user_123". Let's use the default for User B.
    from backend.main import app, get_current_user
    
    # GET as User B (default test_user_123)
    headers_B = {"Authorization": "Bearer test_token"}
    res_B = client.get("/analysis", headers=headers_B)
    assert res_B.status_code == 200
    assert res_B.json()["user_id"] == "test_user_123"
    assert res_B.json()["health_score"] == 90

    # Override for User A
    app.dependency_overrides[get_current_user] = lambda: "userA"
    res_A = client.get("/analysis", headers=headers_B)
    assert res_A.status_code == 200
    assert res_A.json()["user_id"] == "userA"
    assert res_A.json()["health_score"] == 50
    
    # Reset overrides
    app.dependency_overrides = {}



def test_cors_localhost():
    headers = {"Origin": "http://localhost:5173"}
    response = client.get("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"

def test_cors_configured_production_frontend(monkeypatch):
    import importlib
    import backend.main
    from fastapi.testclient import TestClient

    monkeypatch.setenv("FRONTEND_URL", "https://example.trace-mind.com")
    importlib.reload(backend.main)
    local_client = TestClient(backend.main.app)

    headers = {"Origin": "https://example.trace-mind.com"}
    response = local_client.get("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://example.trace-mind.com"

    monkeypatch.delenv("FRONTEND_URL", raising=False)
    importlib.reload(backend.main)

def test_cors_vercel_explicit_allowed():
    # Test allowed vercel origin 1
    headers = {"Origin": "https://trace-mind-git-main-chettay-srikars-projects.vercel.app"}
    response = client.get("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://trace-mind-git-main-chettay-srikars-projects.vercel.app"

    # Test allowed vercel origin 2
    headers = {"Origin": "https://trace-mind-inky.vercel.app"}
    response = client.get("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://trace-mind-inky.vercel.app"

def test_cors_vercel_rejected():
    # Should reject an arbitrary vercel project
    headers = {"Origin": "https://evil-project.vercel.app"}
    response = client.get("/", headers=headers)
    assert response.headers.get("access-control-allow-origin") is None

    # Should reject something trying to bypass regex matching
    headers = {"Origin": "https://trace-mind-evil-project.vercel.app"}
    response = client.get("/", headers=headers)
    assert response.headers.get("access-control-allow-origin") is None

    # Should reject standard attacker domain
    headers = {"Origin": "https://attacker.vercel.app"}
    response = client.get("/", headers=headers)
    assert response.headers.get("access-control-allow-origin") is None

def test_cors_unrelated_origin():
    # Should reject non-vercel unrelated domain
    headers = {"Origin": "https://evil-attacker.com"}
    response = client.get("/", headers=headers)
    assert response.headers.get("access-control-allow-origin") is None
