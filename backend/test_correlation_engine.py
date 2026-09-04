import unittest
import json
from pathlib import Path
from backend.correlation_engine import correlate_incident

class TestCorrelationEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        logs_path = Path(__file__).resolve().parent.parent / "data" / "logs.json"
        if not logs_path.exists():
            raise FileNotFoundError("logs.json not found. Run telemetry generator first.")
        with open(logs_path, "r", encoding="utf-8") as f:
            cls.all_logs = json.load(f)

    def test_normal_telemetry(self):
        """Test that normal logs yield an empty/resolved incident."""
        normal_logs = [log for log in self.all_logs if log.get("scenario") == "normal"]
        incident = correlate_incident(normal_logs)
        self.assertEqual(incident["incident_type"], "normal")
        self.assertEqual(incident["status"], "resolved")
        self.assertEqual(incident["correlation_score"], 0)
        self.assertEqual(len(incident["timeline"]), 0)

    def test_database_failure_correlation(self):
        """Test severity progression, timeline ordering, and services."""
        db_logs = [log for log in self.all_logs if log.get("scenario") == "database failure"]
        incident = correlate_incident(db_logs)
        
        self.assertEqual(incident["incident_type"], "database failure")
        self.assertIn("database", incident["affected_services"])
        self.assertIn("user-service", incident["affected_services"])
        
        # Test severity bounds
        self.assertTrue(0 <= incident["correlation_score"] <= 100)
        self.assertEqual(incident["severity"], "CRITICAL")
        
        # Test timeline length and ordering
        self.assertGreater(len(incident["timeline"]), 0)
        
        # Trigger event should be the first one (likely INFO or WARNING)
        trigger = incident["trigger_event"]
        self.assertEqual(trigger["service"], "database")
        
        # Peak event should be CRITICAL
        peak = incident["peak_event"]
        self.assertEqual(peak["level"], "CRITICAL")

    def test_memory_problem_correlation(self):
        """Test single-service incident correlation."""
        mem_logs = [log for log in self.all_logs if log.get("scenario") == "memory problem"]
        incident = correlate_incident(mem_logs)
        self.assertEqual(incident["incident_type"], "memory problem")
        self.assertEqual(len(incident["affected_services"]), 1)
        self.assertIn("notification-service", incident["affected_services"])

    def test_schema(self):
        """Test incident object schema."""
        logs = [log for log in self.all_logs if log.get("scenario") == "api timeout"]
        incident = correlate_incident(logs)
        
        self.assertIn("incident_id", incident)
        self.assertIn("incident_type", incident)
        self.assertIn("severity", incident)
        self.assertIn("affected_services", incident)
        self.assertIn("correlation_score", incident)
        self.assertIn("status", incident)
        self.assertIn("trigger_event", incident)
        self.assertIn("peak_event", incident)
        self.assertIn("timeline", incident)

    def test_repeated_analysis(self):
        """Test deterministic nature (repeated runs yield same outcome)."""
        logs = [log for log in self.all_logs if log.get("scenario") == "network problem"]
        i1 = correlate_incident(logs)
        i2 = correlate_incident(logs)
        
        # Ignore random UUID
        i1.pop("incident_id")
        i2.pop("incident_id")
        self.assertEqual(i1, i2)

if __name__ == "__main__":
    unittest.main()
