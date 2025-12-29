from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from auth import Token, User, get_current_user, create_access_token, verify_password, USERS_DB, check_admin_role
from audit_logger import log_incident_query, get_audit_logs
from agent import IncidentAgent
from rag_engine import RAGEngine
import os
from dotenv import load_dotenv
from datetime import timedelta
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request

# Load environment before local imports
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

app = FastAPI(title="Secure Incident Investigator API")
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

rag_engine = RAGEngine()
agent = IncidentAgent()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

@app.get("/")
async def root():
    return {"message": "Secure Incident Investigator API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user_dict = USERS_DB.get(form_data.username)
    if not user_dict or not verify_password(form_data.password, user_dict["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user_dict["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/query")
@limiter.limit("5/minute")
async def query_endpoint(request: Request, query_data: QueryRequest, current_user: User = Depends(get_current_user)):
    try:
        result = agent.run(query_data.query, role=current_user.role)
        return {
            "query": query_data.query,
            "classification": result["classification"],
            "report": result["report"],
            "sources": result["sources"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest")
async def ingest_endpoint(current_user: User = Depends(check_admin_role)):
    try:
        rag_engine.ingest_documents()
        return {"message": "Documents ingested successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/audit")
async def audit_endpoint(current_user: User = Depends(check_admin_role)):
    return get_audit_logs()

@app.get("/history")
async def history_endpoint(current_user: User = Depends(get_current_user)):
    # Returns the last 10 investigations
    logs = get_audit_logs()
    
    # SECURITY: Analysts should only see their own history
    if current_user.role != "admin":
        logs = [log for log in logs if log.get("user") == current_user.username]
        
    return logs[-10:] if logs else []
