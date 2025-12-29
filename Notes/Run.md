# Ragbot Tool Operational

The Ragbot tool is now up and running with both the backend API and frontend user interface accessible.

## Changes Made
- Started the FastAPI backend server on port 8000.
- Started the Next.js frontend development server on port 3000.
- Verified backend health via `/health` endpoint.

## Enterprise Pluggable Structure
The tool is now organized for organizational use. Companies can plug in their own data by placing files in the following folders:

### 1. Security Knowledge (`data/knowledge/`)
Put documentation here to be vectorized for semantic search:
- **`playbooks/`**: Standard Operating Procedures and internal IR policies.
- **`threat_intel/`**: Live feeds, reports, and evidence from external sources.
- **`mitre_framework/`**: Mapping of TTPs.

### 2. Live Logs (`data/raw_logs/`)
- Place your `logs.json` here. The tool uses programmatic logic to analyze these for precise metrics.

## How to Access
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://127.0.0.1:8000](http://127.0.0.1:8000)

## Commands Used
### Backend (from `backend/` directory)
```bash
python3.13 -m uvicorn main:app --reload --port 8000
```

### Frontend (from `frontend/` directory)
```bash
npm run dev -- -p 3000
```

## Maintenance
To refresh the knowledge base after adding new files:
```bash
# In backend/ directory
python3.13 rag_engine.py
```

## Verification Results
- **Backend Health Check:** `{"status":"healthy"}`
- **Frontend Status:** Ready and listening on port 3000.