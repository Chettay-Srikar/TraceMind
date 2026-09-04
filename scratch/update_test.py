import os

def update_test_import():
    with open("backend/test_import.py", "r", encoding="utf-8") as f:
        content = f.read()

    new_tests = """
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
"""
    content += new_tests
    with open("backend/test_import.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Added new tests to test_import.py")

update_test_import()
