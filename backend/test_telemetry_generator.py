import unittest
import json
from datetime import datetime
from backend.telemetry_generator import (
    generate_telemetry,
    validate_logs,
    SERVICES,
    LEVELS,
    SCENARIOS
)

class TestTelemetryGenerator(unittest.TestCase):
    def test_deterministic_generation(self):
        """Test that supplying a seed produces reproducible results."""
        logs1 = generate_telemetry(seed=123)
        logs2 = generate_telemetry(seed=123)
        logs3 = generate_telemetry(seed=456)
        
        self.assertEqual(logs1, logs2)
        self.assertNotEqual(logs1, logs3)

    def test_validation_logic(self):
        """Test the validation function with valid and invalid inputs."""
        valid_logs = generate_telemetry(seed=42)
        self.assertTrue(validate_logs(valid_logs))
        
        # Test missing field
        invalid_logs = [dict(log) for log in valid_logs]
        del invalid_logs[0]["level"]
        self.assertFalse(validate_logs(invalid_logs))
        
        # Test invalid service
        invalid_logs = [dict(log) for log in valid_logs]
        invalid_logs[0]["service"] = "unknown-service"
        self.assertFalse(validate_logs(invalid_logs))
        
        # Test invalid chronological order
        invalid_logs = [dict(log) for log in valid_logs]
        if len(invalid_logs) > 1:
            invalid_logs[0], invalid_logs[-1] = invalid_logs[-1], invalid_logs[0]
            self.assertFalse(validate_logs(invalid_logs))

    def test_log_structure(self):
        """Test the structure of generated logs."""
        logs = generate_telemetry(seed=42)
        
        for log in logs:
            self.assertIn("timestamp", log)
            self.assertIn("service", log)
            self.assertIn("level", log)
            self.assertIn("message", log)
            self.assertIn("response_time_ms", log)
            self.assertIn("scenario", log)
            
            self.assertIn(log["service"], SERVICES)
            self.assertIn(log["level"], LEVELS)
            self.assertIn(log["scenario"], SCENARIOS)
            self.assertIsInstance(log["response_time_ms"], (int, float))
            
            # Check timestamp format
            try:
                datetime.fromisoformat(log["timestamp"])
            except ValueError:
                self.fail(f"Invalid timestamp format: {log['timestamp']}")

    def test_scenarios_present(self):
        """Test that all intended scenarios are generated."""
        logs = generate_telemetry(seed=42)
        generated_scenarios = set(log["scenario"] for log in logs)
        
        for scenario in SCENARIOS:
            self.assertIn(scenario, generated_scenarios)
            
    def test_chronological_order(self):
        """Test that the final output is sorted chronologically."""
        logs = generate_telemetry(seed=42)
        timestamps = [datetime.fromisoformat(log["timestamp"]) for log in logs]
        self.assertEqual(timestamps, sorted(timestamps))

if __name__ == "__main__":
    unittest.main()
