import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from hindsight_client import Hindsight
import groq

# Load environment variables
load_dotenv()

app = FastAPI(title="DevOps Incident Response Agent API")

# Setup CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HINDSIGHT_API_KEY = os.getenv("HINDSIGHT_API_KEY")
HINDSIGHT_BASE_URL = os.getenv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not HINDSIGHT_API_KEY or not GROQ_API_KEY:
    print("WARNING: API keys are missing. Please check your .env file.")

hindsight_client = Hindsight(api_key=HINDSIGHT_API_KEY, base_url=HINDSIGHT_BASE_URL)
groq_client = groq.Groq(api_key=GROQ_API_KEY)

BANK_ID = "devops-incidents"

class IncidentRequest(BaseModel):
    error_log: str

class ResolveRequest(BaseModel):
    symptoms: str
    error_log: str
    root_cause: str
    resolution: str

@app.get("/")
def read_root():
    return {"message": "DevOps Incident Response Agent is running."}

@app.post("/api/incident/analyze")
def analyze_incident(req: IncidentRequest):
    # Step 1: Recall past incidents from Hindsight memory
    try:
        recall_response = hindsight_client.recall(bank_id=BANK_ID, query=req.error_log)
        # Hindsight client usually returns an object with results.
        # Handling the result format robustly.
        past_incidents = ""
        if hasattr(recall_response, 'results'):
            for i, result in enumerate(recall_response.results):
                past_incidents += f"\n--- Past Incident {i+1} ---\n{result.content}\n"
        elif isinstance(recall_response, list):
            for i, result in enumerate(recall_response):
                content = result.get('content', '') if isinstance(result, dict) else getattr(result, 'content', str(result))
                past_incidents += f"\n--- Past Incident {i+1} ---\n{content}\n"
        elif isinstance(recall_response, dict) and 'results' in recall_response:
             for i, result in enumerate(recall_response['results']):
                content = result.get('content', '') if isinstance(result, dict) else str(result)
                past_incidents += f"\n--- Past Incident {i+1} ---\n{content}\n"
    except Exception as e:
        print(f"Hindsight recall error: {e}")
        past_incidents = "No memory accessed due to error."

    # Step 2: Formulate prompt for Groq LLM
    prompt = f"""You are an elite DevOps Incident Response AI. Your job is to analyze the new error log, look at past incidents in your memory, and provide:
1. A brief suspected root cause.
2. Step-by-step resolution steps.

Format your output in Markdown. Be concise, technical, and directly reference past incidents if they are relevant.

### New Incident Error Log:
{req.error_log}

### Your Memory (Past Incidents):
{past_incidents if past_incidents.strip() else "You have no past incidents related to this."}
"""

    # Step 3: Ask Groq
    try:
        completion = groq_client.chat.completions.create(
            model="qwen-2.5-32b", # Using qwen as recommended
            messages=[
                {"role": "system", "content": "You are a helpful DevOps assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=1024,
        )
        diagnosis = completion.choices[0].message.content
    except Exception as e:
        print(f"Groq API error: {e}")
        # fallback model name
        try:
             completion = groq_client.chat.completions.create(
                 model="llama3-8b-8192", 
                 messages=[
                     {"role": "system", "content": "You are a helpful DevOps assistant."},
                     {"role": "user", "content": prompt}
                 ],
                 temperature=0.2,
                 max_tokens=1024,
             )
             diagnosis = completion.choices[0].message.content
        except Exception as fallback_e:
            raise HTTPException(status_code=500, detail=str(fallback_e))

    return {
        "diagnosis": diagnosis,
        "past_incidents_recalled": bool(past_incidents.strip())
    }

@app.post("/api/incident/resolve")
def resolve_incident(req: ResolveRequest):
    # Push the resolution to Hindsight to make the agent smarter
    content = f"""
Symptoms: {req.symptoms}
Error Log: {req.error_log}
Root Cause: {req.root_cause}
Resolution: {req.resolution}
    """.strip()
    
    try:
        hindsight_client.retain(bank_id=BANK_ID, content=content)
        return {"status": "success", "message": "Memory updated. The agent has learned from this incident."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/memory/stats")
def get_memory_stats():
    total_memories = 0
    memories = []
    mental_models = []
    
    try:
        mem_resp = hindsight_client.list_memories(bank_id=BANK_ID)
        mem_list = mem_resp.results if hasattr(mem_resp, 'results') else (mem_resp.get('results', []) if isinstance(mem_resp, dict) else (mem_resp if isinstance(mem_resp, list) else []))
        total_memories = len(mem_list)
        for m in mem_list[-10:]:
            content = m.get('content', '') if isinstance(m, dict) else getattr(m, 'content', str(m))
            memories.append(content)
    except Exception as e:
        print(f"Error fetching memories: {e}")
        
    try:
        mm_resp = hindsight_client.list_mental_models(bank_id=BANK_ID)
        mm_list = mm_resp.results if hasattr(mm_resp, 'results') else (mm_resp.get('results', []) if isinstance(mm_resp, dict) else (mm_resp if isinstance(mm_resp, list) else []))
        for m in mm_list:
             content = m.get('content', '') if isinstance(m, dict) else getattr(m, 'content', str(m))
             mental_models.append(content)
    except Exception as e:
        print(f"Error fetching mental models: {e}")
        
    return {
        "total_memories": total_memories,
        "memories": memories,
        "mental_models": mental_models
    }

@app.get("/api/incident/history")
def get_incident_history():
    incidents = []
    try:
        recall_response = hindsight_client.recall(bank_id=BANK_ID, query="incident resolution")
        if hasattr(recall_response, 'results'):
            results = recall_response.results
        elif isinstance(recall_response, list):
            results = recall_response
        elif isinstance(recall_response, dict) and 'results' in recall_response:
            results = recall_response['results']
        else:
            results = []
            
        for result in results:
            content = result.get('content', '') if isinstance(result, dict) else getattr(result, 'content', str(result))
            incidents.append({"content": content})
    except Exception as e:
        print(f"Hindsight recall error in history: {e}")
        
    return {"incidents": incidents}
