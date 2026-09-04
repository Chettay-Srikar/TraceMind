import unittest
from backend.recovery_verification import verify_recovery

class TestRecoveryVerification(unittest.TestCase):
    def setUp(self):
        self.mock_final_result = {
            "remediation": {
                "status": "completed",
                "remediation_id": "rem-12345",
                "solution_id": "sol_123",
                "pre_remediation_state": {
                    "health_score": 20,
                    "anomaly_score": 100,
                    "severity": "CRITICAL",
                    "incident_type": "database failure" # seed: len(16) + len(7) = 23. factor: 0.3 + (23%7=2)*0.1 = 0.5. post_health = 20 + 80*0.5=60, post_anomaly = 100 - 50 = 50 -> WARNING
                }
            }
        }
        
    def test_partial_recovery(self):
        # Using the base setup -> factor 0.5 -> health 60, anomaly 50, WARNING severity -> Partially Recovered
        result, status = verify_recovery(self.mock_final_result)
        
        self.assertEqual(status, "completed")
        self.assertIn("recovery_verification", result)
        
        rec_data = result["recovery_verification"]
        self.assertEqual(rec_data["status"], "partially_recovered")
        
        # Verify delta and bounds
        self.assertEqual(rec_data["post_remediation_state"]["health_score"], 60)
        self.assertEqual(rec_data["post_remediation_state"]["severity"], "WARNING")
        
        self.assertEqual(rec_data["changes"]["health_score_delta"], 40)
        self.assertEqual(rec_data["changes"]["anomaly_score_delta"], -50)
        self.assertTrue(rec_data["changes"]["severity_changed"])
        
        # Verify recovery score
        self.assertEqual(rec_data["recovery_score"], 45) # (40 + 50) / 2
        
        # Verify evidence explicit log
        self.assertTrue(any("Health score improved from 20 to 60 (+40)." in log for log in rec_data["evidence"]))

    def test_full_recovery(self):
        # Manipulate incident type length to get seed % 10 == 0 -> factor 1.0 -> FULL RECOVERY
        # len("db failure") = 10 + len("sol_12") = 6 -> 16 doesn't end in 0
        # Wait, if seed % 10 == 0 -> factor 1.0. 
        # let incident_type="db", sol="12345678" -> len 10.
        full_rec_result = dict(self.mock_final_result)
        full_rec_result["remediation"]["pre_remediation_state"]["incident_type"] = "db"
        full_rec_result["remediation"]["solution_id"] = "12345678" 
        
        result, _ = verify_recovery(full_rec_result)
        rec_data = result["recovery_verification"]
        
        self.assertEqual(rec_data["status"], "recovered")
        self.assertEqual(rec_data["post_remediation_state"]["health_score"], 100)
        self.assertEqual(rec_data["post_remediation_state"]["severity"], "NORMAL")
        self.assertEqual(rec_data["recovery_score"], 100)
        
    def test_not_recovered(self):
        # Manipulate to get low improvement factor.
        # factor 0.3 + (seed % 7)*0.1. Min factor = 0.3.
        # health = 20 + 80*0.3 = 44. Delta = 24. Anomaly = 100 - 30 = 70.
        # Wait, anomaly 70 is WARNING. Health delta 24 > 10. So it will be partially recovered!
        # How to get NOT_RECOVERED? 
        # If pre_health is 10, health_space is 90. health=10+27=37 (delta 27). Anomaly=100-30=70. Partially recovered.
        # How to get NOT_RECOVERED? final severity == "CRITICAL".
        # Need anomaly > 75. 
        # factor 0.3 -> post_anomaly = 100 - 30 = 70.
        # If pre_anomaly = 150 -> post_anomaly = 150 - 45 = 105 -> CRITICAL!
        
        not_rec_result = dict(self.mock_final_result)
        not_rec_result["remediation"]["pre_remediation_state"]["anomaly_score"] = 150
        # Ensure seed % 7 == 0 -> factor 0.3
        # len(type) + len(sol) = 7. type="db", sol="12345"
        not_rec_result["remediation"]["pre_remediation_state"]["incident_type"] = "db"
        not_rec_result["remediation"]["solution_id"] = "12345"
        
        result, _ = verify_recovery(not_rec_result)
        rec_data = result["recovery_verification"]
        
        self.assertEqual(rec_data["status"], "not_recovered")
        self.assertEqual(rec_data["post_remediation_state"]["severity"], "CRITICAL")
        self.assertTrue(any("not recovered due to negligible improvement or remaining CRITICAL severity." in log for log in rec_data["evidence"]))

        
    def test_not_verified_when_remediation_skipped(self):
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
        self.assertEqual(result["recovery_verification"]["status"], "not_verified")
        self.assertEqual(result["recovery_verification"]["changes"]["health_score_delta"], 0)

    def test_not_verified_when_missing_pre_state(self):
        missing_result = {
            "remediation": {
                "status": "completed",
                "pre_remediation_state": {}
            }
        }
        
        result, status = verify_recovery(missing_result)
        self.assertEqual(status, "skipped")
        self.assertEqual(result["recovery_verification"]["status"], "not_verified")
        self.assertIn("Missing pre-remediation state", result["recovery_verification"]["verification_summary"])

if __name__ == "__main__":
    unittest.main()
