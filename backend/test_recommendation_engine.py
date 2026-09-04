import unittest
from backend.recommendation_engine import rank_solutions

class TestRecommendationEngine(unittest.TestCase):
    def setUp(self):
        self.mock_final_result = {
            "incident": {
                "incident_type": "database failure"
            },
            "ai_investigation": {
                "root_cause_confidence": 100
            },
            "solution_intelligence": {
                "solutions": [
                    {
                        "solution_id": "sol_low_risk",
                        "title": "Low Risk Solution",
                        "evidence_fit": 90,
                        "confidence": 90,
                        "implementation_complexity": 20,
                        "risk": "low",
                        "effort": "low"
                    },
                    {
                        "solution_id": "sol_high_risk",
                        "title": "High Risk Solution",
                        "evidence_fit": 90,
                        "confidence": 90,
                        "implementation_complexity": 80,
                        "risk": "high",
                        "effort": "high"
                    },
                    {
                        "solution_id": "sol_medium",
                        "title": "Medium Solution",
                        "evidence_fit": 50,
                        "confidence": 50,
                        "implementation_complexity": 50,
                        "risk": "medium",
                        "effort": "medium"
                    }
                ]
            }
        }
        
    def test_successful_ranking(self):
        result, status = rank_solutions(self.mock_final_result)
        
        self.assertEqual(status, "connected")
        self.assertIn("recommendation", result)
        
        rec_data = result["recommendation"]
        self.assertEqual(rec_data["recommendation_status"], "complete")
        
        recs = rec_data["recommendations"]
        self.assertEqual(len(recs), 3)
        
        # Verify descending order
        scores = [r["recommendation_score"] for r in recs]
        self.assertEqual(scores, sorted(scores, reverse=True))
        
        # Verify rank 1 is selected
        self.assertEqual(recs[0]["rank"], 1)
        self.assertEqual(recs[0]["solution_id"], rec_data["selected_recommendation"]["solution_id"])
        
        # Low risk should beat high risk
        self.assertEqual(recs[0]["solution_id"], "sol_low_risk")
        self.assertEqual(recs[2]["solution_id"], "sol_high_risk")
        
    def test_confidence_discounting(self):
        result_high_conf, _ = rank_solutions(self.mock_final_result)
        high_score = result_high_conf["recommendation"]["recommendations"][0]["recommendation_score"]
        
        low_conf_result = dict(self.mock_final_result)
        low_conf_result["ai_investigation"] = {"root_cause_confidence": 50}
        
        result_low_conf, _ = rank_solutions(low_conf_result)
        low_score = result_low_conf["recommendation"]["recommendations"][0]["recommendation_score"]
        
        # Discount factor 0.5 -> Final score multiplier 0.75
        self.assertLess(low_score, high_score)
        
    def test_tie_breaking(self):
        tie_result = {
            "incident": {"incident_type": "database failure"},
            "solution_intelligence": {
                "solutions": [
                    {
                        "solution_id": "sol_z",
                        "title": "Zebra",
                        "evidence_fit": 50, "confidence": 50, "implementation_complexity": 50, "risk": "medium", "effort": "medium"
                    },
                    {
                        "solution_id": "sol_a",
                        "title": "Apple",
                        "evidence_fit": 50, "confidence": 50, "implementation_complexity": 50, "risk": "medium", "effort": "medium"
                    }
                ]
            }
        }
        result, _ = rank_solutions(tie_result)
        recs = result["recommendation"]["recommendations"]
        self.assertEqual(recs[0]["title"], "Apple")
        self.assertEqual(recs[1]["title"], "Zebra")
        self.assertEqual(recs[0]["recommendation_score"], recs[1]["recommendation_score"])
        
    def test_fallback_normal_scenario(self):
        normal_result = {
            "incident": {"incident_type": "normal"},
            "solution_intelligence": {"solutions": [{"title": "monitoring"}]}
        }
        result, status = rank_solutions(normal_result)
        self.assertEqual(status, "unavailable")
        self.assertEqual(result["recommendation"]["recommendation_status"], "fallback")
        self.assertEqual(len(result["recommendation"]["recommendations"]), 0)

if __name__ == "__main__":
    unittest.main()
