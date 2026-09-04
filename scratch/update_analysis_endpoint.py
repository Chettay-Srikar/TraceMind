import os

def update_main():
    with open("backend/main.py", "r", encoding="utf-8") as f:
        content = f.read()

    # Refactor the analysis pipeline into a helper
    helper_code = """
def _execute_analysis_pipeline(user_id: str, ensure_logs: bool = False):
    collection = get_logs_collection()
    cursor = collection.find({"user_id": user_id}).sort("timestamp", 1)
    all_logs = [serialize_mongo_doc(doc) for doc in cursor]
    
    if ensure_logs and not all_logs:
        raise ValueError("No telemetry imported for this user.")
        
    deterministic_result = analyze_logs(all_logs)
    enhanced_result, ai_status = investigate_incident(deterministic_result)
    sol_result, intel_status = generate_solutions(enhanced_result)
    rec_result, rec_status = rank_solutions(sol_result)
    rem_result, rem_status = execute_remediation(rec_result)
    final_result, ver_status = verify_recovery(rem_result)
    
    final_result["ai_provider"] = "featherless" if ai_status == "connected" else "deterministic_fallback"
    final_result["ai_status"] = ai_status
    
    return final_result

@app.post("/analysis/run")
async def run_analysis(user_id: str = Depends(get_current_user)):
    try:
        return _execute_analysis_pipeline(user_id, ensure_logs=True)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Database connection error")

@app.get("/analysis")"""

    # We need to replace the @app.get("/analysis") and its content
    
    # First, let's find the start of get_analysis
    import re
    # We will replace from @app.get("/analysis") down to the end of the file since it's the last function
    match = re.search(r'@app\.get\("/analysis"\).*', content, re.DOTALL)
    if match:
        old_analysis = match.group(0)
        
        new_analysis = """@app.get("/analysis")
async def get_analysis(user_id: str = Depends(get_current_user)):
    \"\"\"
    Returns the current deterministic TraceMind incident analysis.
    \"\"\"
    try:
        return _execute_analysis_pipeline(user_id, ensure_logs=False)
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Database connection error")
"""
        
        content = content.replace(old_analysis, helper_code.replace('@app.get("/analysis")', new_analysis))
        
        with open("backend/main.py", "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated backend/main.py")
    else:
        print("Could not find get_analysis in backend/main.py")

update_main()
