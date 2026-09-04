import os

def add_cross_user_test():
    with open("backend/test_import.py", "r", encoding="utf-8") as f:
        content = f.read()

    new_test = """
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
"""
    content += new_test
    with open("backend/test_import.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Added cross user test")

add_cross_user_test()
