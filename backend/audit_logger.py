import json
import os
from datetime import datetime
from typing import Any, Dict

LOG_FILE = os.path.join(os.path.dirname(__file__), "../data/audit_log.json")

def log_incident_query(
    username: str, 
    role: str, 
    query: str, 
    classification: str, 
    report: str, 
    sources: list, 
    retrieved_chunks: list = None,
    model_version: str = "gpt-4o"
):
    """Logs an incident investigation query and its full RAG context for audit/replay."""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "user": username,
        "role": role,
        "query": query,
        "classification": classification,
        "report": report,
        "model_version": model_version,
        "sources_referenced": [str(s) for s in sources],
        "retrieved_chunks": retrieved_chunks or []
    }
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    
    # Read existing logs or create new list
    logs = []
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, 'r') as f:
                logs = json.load(f)
        except (json.JSONDecodeError, IOError):
            logs = []
            
    logs.append(log_entry)
    
    # Write back to file
    with open(LOG_FILE, 'w') as f:
        json.dump(logs, f, indent=2)

def get_audit_logs():
    """Retrieves all audit logs."""
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r') as f:
            return json.load(f)
    return []
