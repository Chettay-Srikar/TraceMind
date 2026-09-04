import unittest
from backend.recovery_verification import verify_recovery

class TestRecoveryVerification(unittest.TestCase):
    def setUp(self):
        self.mock_final_result = {
            "remediation": {
                "status": "completed",
                "remediation_id": "rem-12345",
                "pre_remediation_state": {
                    "health_score": 40,
                    "anomaly_score": 80,
                    "severity": "CRITICAL"
                }
            }
        }
        
    def test_successful_recovery(self):
        result, status = verify_recovery(self.mock_final_result)
        
        self.assertEqual(status, "completed")
        self.assertIn("recovery_verification", result)
        
        rec_data = result["recovery_verification"]
        self.assertEqual(rec_data["verification_status"], "completed")
        self.assertEqual(rec_data["recovery_status"], "verified")
        
        # Verify states are present
        self.assertEqual(rec_data["pre_remediation_state"]["health_score"], 40)
        self.assertEqual(rec_data["post_remediation_state"]["health_score"], 100)
        self.assertEqual(rec_data["post_remediation_state"]["severity"], "NORMAL")
        
        # Verify logs explicitly document improvement
        self.assertTrue(any("improved from 40 to 100" in log for log in rec_data["verification_log"]))
        
    def test_skipped_when_remediation_skipped(self):
        skipped_result = {
            "remediation": {
                "status": "skipped",
                "pre_remediation_state": {
                    "health_score": 100
                }
            }
        }
        
        result, status = verify_recovery(skipped_result)
        self.assertEqual(status, "skipped")
        self.assertEqual(result["recovery_verification"]["verification_status"], "skipped")
        self.assertEqual(result["recovery_verification"]["recovery_status"], "not_applicable")

if __name__ == "__main__":
    unittest.main()
