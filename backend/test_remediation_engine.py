import unittest
from backend.remediation_engine import execute_remediation

class TestRemediationEngine(unittest.TestCase):
    def setUp(self):
        self.mock_final_result = {
            "health_score": 40,
            "anomaly_score": 80,
            "severity": "CRITICAL",
            "incident": {
                "incident_type": "database failure",
                "affected_services": ["database", "api-gateway"]
            },
            "recommendation": {
                "selected_recommendation": {
                    "solution_id": "sol_123",
                    "title": "Increase Connection Limits",
                    "confidence": 90,
                    "expected_impact": "Fix DB"
                }
            }
        }
        
    def test_successful_simulation(self):
        result, status = execute_remediation(self.mock_final_result)
        
        self.assertEqual(status, "simulated")
        self.assertIn("remediation", result)
        
        rem_data = result["remediation"]
        self.assertEqual(rem_data["mode"], "simulated")
        self.assertEqual(rem_data["status"], "completed")
        self.assertEqual(rem_data["solution_id"], "sol_123")
        
        # Verify pre-state is captured
        self.assertEqual(rem_data["pre_remediation_state"]["health_score"], 40)
        self.assertEqual(rem_data["pre_remediation_state"]["severity"], "CRITICAL")
        
        # Verify simulation logs exist and don't make post-recovery claims
        self.assertTrue(any("SIMULATED" in log for log in rem_data["execution_log"]))
        self.assertTrue(any("Would apply" in change["change"] for change in rem_data["simulated_changes"]))
        
    def test_low_confidence_warning(self):
        low_conf_result = dict(self.mock_final_result)
        low_conf_result["recommendation"] = {
            "selected_recommendation": {
                "solution_id": "sol_123",
                "title": "Unknown Action",
                "confidence": 30, # Low confidence
                "expected_impact": "Maybe fix it"
            }
        }
        
        result, _ = execute_remediation(low_conf_result)
        rem_data = result["remediation"]
        
        self.assertTrue(any("WARNING" in log for log in rem_data["execution_log"]))
        
    def test_skipped_for_normal_incident(self):
        normal_result = {
            "incident": {"incident_type": "normal"},
            "recommendation": {
                "selected_recommendation": {
                    "solution_id": "sol_123",
                    "title": "Monitoring"
                }
            }
        }
        
        result, status = execute_remediation(normal_result)
        self.assertEqual(status, "skipped")
        self.assertEqual(result["remediation"]["status"], "skipped")
        self.assertIn("No active incident", result["remediation"]["error"])

    def test_skipped_for_missing_recommendation(self):
        missing_rec_result = {
            "incident": {"incident_type": "database failure"},
            "recommendation": {} # empty
        }
        
        result, status = execute_remediation(missing_rec_result)
        self.assertEqual(status, "skipped")
        self.assertEqual(result["remediation"]["status"], "skipped")
        
if __name__ == "__main__":
    unittest.main()
