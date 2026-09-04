import unittest
from unittest.mock import patch
from backend.solution_intelligence import generate_solutions

class TestSolutionIntelligence(unittest.TestCase):
    def setUp(self):
        self.mock_enhanced_result_db = {
            "root_cause": "Database failure",
            "confidence": 95,
            "incident": {
                "incident_type": "database failure",
                "severity": "CRITICAL",
                "affected_services": ["database"],
                "correlation_score": 90,
                "status": "active",
            },
            "ai_investigation": {
                "root_cause": "Database connection limits exceeded.",
                "root_cause_confidence": 95,
                "uncertainties": []
            }
        }
        self.mock_enhanced_result_api = dict(self.mock_enhanced_result_db)
        self.mock_enhanced_result_api["incident"] = {"incident_type": "api timeout"}
        
        self.mock_enhanced_result_normal = {
            "incident": {"incident_type": "normal"}
        }
        
    @patch("backend.solution_intelligence.run_investigation")
    def test_successful_solution_generation(self, mock_run):
        mock_response = {
            "solutions": [
                {
                    "solution_id": "sol_1",
                    "title": "Fix DB",
                    "description": "Increase limits.",
                    "why_it_fits": "Fits evidence.",
                    "expected_impact": "Fixes things.",
                    "risk": "low",
                    "effort": "low",
                    "evidence_fit": 95,
                    "implementation_complexity": 20,
                    "confidence": 90,
                    "tradeoffs": [],
                    "prerequisites": [],
                    "research_basis": ["internal_reasoning"]
                }
            ],
            "solution_count": 1
        }
        mock_run.return_value = (mock_response, "connected")
        
        result, status = generate_solutions(self.mock_enhanced_result_db)
        self.assertEqual(status, "connected")
        self.assertIn("solution_intelligence", result)
        self.assertEqual(result["solution_intelligence"]["intelligence_status"], "complete")
        
    @patch("backend.solution_intelligence.run_investigation")
    def test_fallback_due_to_malformed_response(self, mock_run):
        # Missing evidence_fit
        mock_response = {
            "solutions": [
                {
                    "solution_id": "sol_1",
                    "title": "Fix DB",
                    "description": "Increase limits.",
                    "risk": "low",
                    "effort": "low",
                    # missing fields
                }
            ],
            "solution_count": 1
        }
        mock_run.return_value = (mock_response, "connected")
        
        result, status = generate_solutions(self.mock_enhanced_result_db)
        self.assertEqual(status, "unavailable")
        self.assertEqual(result["solution_intelligence"]["intelligence_status"], "fallback")
        self.assertGreater(result["solution_intelligence"]["solution_count"], 0)
        
    @patch("backend.solution_intelligence.run_investigation")
    def test_fallback_due_to_hallucinated_url(self, mock_run):
        mock_response = {
            "solutions": [
                {
                    "solution_id": "sol_1",
                    "title": "Fix DB",
                    "description": "Increase limits.",
                    "why_it_fits": "Fits evidence.",
                    "expected_impact": "Fixes things.",
                    "risk": "low",
                    "effort": "low",
                    "evidence_fit": 95,
                    "implementation_complexity": 20,
                    "confidence": 90,
                    "tradeoffs": [],
                    "prerequisites": [],
                    "research_basis": ["http://fake-research.com"] # Hallucination
                }
            ],
            "solution_count": 1
        }
        mock_run.return_value = (mock_response, "connected")
        
        result, status = generate_solutions(self.mock_enhanced_result_db)
        self.assertEqual(status, "unavailable")
        self.assertEqual(result["solution_intelligence"]["intelligence_status"], "fallback")

    def test_fallback_for_normal_scenario(self):
        result, status = generate_solutions(self.mock_enhanced_result_normal)
        self.assertEqual(status, "unavailable")
        self.assertEqual(result["solution_intelligence"]["intelligence_status"], "fallback")
        self.assertIn("System is operating normally", result["solution_intelligence"]["reason"])

    def test_fallback_database_relevance(self):
        # Without mocking run_investigation, if API key is missing it falls back
        with patch('backend.featherless_client.os.getenv', return_value=None):
            result, status = generate_solutions(self.mock_enhanced_result_db)
            self.assertEqual(status, "unavailable")
            
            sols = result["solution_intelligence"]["solutions"]
            self.assertGreater(len(sols), 0)
            self.assertTrue(any("Connection" in s["title"] or "Circuit" in s["title"] for s in sols))

    def test_fallback_api_timeout_relevance(self):
        with patch('backend.featherless_client.os.getenv', return_value=None):
            result, status = generate_solutions(self.mock_enhanced_result_api)
            sols = result["solution_intelligence"]["solutions"]
            self.assertTrue(any("Gateway" in s["title"] or "Cache" in s["title"] for s in sols))

if __name__ == "__main__":
    unittest.main()
