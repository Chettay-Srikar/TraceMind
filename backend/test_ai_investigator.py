import unittest
from unittest.mock import patch
from backend.ai_investigator import investigate_incident

class TestAIInvestigator(unittest.TestCase):
    def setUp(self):
        self.mock_deterministic_result = {
            "root_cause": "Unknown",
            "confidence": 50,
            "evidence": [],
            "metrics": {},
            "incident": {
                "incident_type": "database failure",
                "severity": "CRITICAL",
                "affected_services": ["database"],
                "correlation_score": 90,
                "status": "active",
                "trigger_event": {"timestamp": "2026-09-04T08:00:00", "service": "database", "level": "INFO"},
                "peak_event": {"timestamp": "2026-09-04T08:05:00", "service": "database", "level": "CRITICAL"},
                "timeline": [
                    {"timestamp": "2026-09-04T08:00:00", "service": "database", "level": "INFO"},
                    {"timestamp": "2026-09-04T08:05:00", "service": "database", "level": "CRITICAL"}
                ]
            }
        }
        
    @patch("backend.ai_investigator.run_investigation")
    def test_successful_investigation(self, mock_run):
        mock_response = {
            "root_cause": "Database connection limits exceeded.",
            "root_cause_confidence": 95,
            "evidence": [
                {
                    "timestamp": "2026-09-04T08:00:00",
                    "service": "database",
                    "level": "INFO",
                    "observation": "Initial event",
                    "supports_root_cause": True
                }
            ],
            "investigation_summary": "DB slowed then crashed.",
            "uncertainties": []
        }
        mock_run.return_value = (mock_response, "connected")
        
        result, status = investigate_incident(self.mock_deterministic_result)
        
        self.assertEqual(status, "connected")
        self.assertIn("ai_investigation", result)
        self.assertEqual(result["ai_investigation"]["investigation_status"], "complete")
        self.assertEqual(result["root_cause"], "Database connection limits exceeded.")
        
    @patch("backend.ai_investigator.run_investigation")
    def test_fallback_due_to_malformed_response(self, mock_run):
        # Missing required field "uncertainties"
        mock_response = {
            "root_cause": "Database connection limits exceeded.",
            "root_cause_confidence": 95,
            "evidence": [],
            "investigation_summary": "DB slowed then crashed."
        }
        mock_run.return_value = (mock_response, "connected")
        
        result, status = investigate_incident(self.mock_deterministic_result)
        
        self.assertEqual(status, "unavailable")
        self.assertEqual(result["ai_investigation"]["investigation_status"], "fallback")
        
    @patch("backend.ai_investigator.run_investigation")
    def test_fallback_due_to_hallucinated_timestamp(self, mock_run):
        mock_response = {
            "root_cause": "Fake cause",
            "root_cause_confidence": 95,
            "evidence": [
                {
                    "timestamp": "2026-01-01T00:00:00", # NOT in timeline
                    "service": "database",
                    "level": "INFO",
                    "observation": "Fake",
                    "supports_root_cause": True
                }
            ],
            "investigation_summary": "Fake",
            "uncertainties": []
        }
        mock_run.return_value = (mock_response, "connected")
        
        result, status = investigate_incident(self.mock_deterministic_result)
        self.assertEqual(status, "unavailable")
        self.assertEqual(result["ai_investigation"]["investigation_status"], "fallback")

    def test_fallback_for_normal_scenario(self):
        normal_result = {
            "root_cause": "Normal",
            "incident": {
                "incident_type": "normal",
                "timeline": []
            }
        }
        result, status = investigate_incident(normal_result)
        self.assertEqual(status, "unavailable")
        self.assertEqual(result["ai_investigation"]["investigation_status"], "fallback")
        self.assertIn("System is operating normally", result["ai_investigation"]["investigation_summary"])

if __name__ == "__main__":
    unittest.main()
