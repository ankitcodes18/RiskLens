import os
import sys
import json
import asyncio
import requests
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Ensure local imports work regardless of execution directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from climate_agent import (
    create_agent,
    USER_LOCATION,
    SYSTEM_PROMPT
)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

app = FastAPI(title="Climate AI Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agent once on server startup
agent = create_agent()

class ChatRequest(BaseModel):
    message: str
    location: Optional[Dict[str, Any]] = None

@app.get("/health")
def health_check():
    return {"status": "ok", "location": USER_LOCATION}

@app.post("/api/transcribe")
async def transcribe_endpoint(file: UploadFile = File(...)):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured on the server.")

    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Audio payload is empty.")

        headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
        files = {
            "file": (file.filename or "audio.webm", content, file.content_type or "audio/webm"),
            "model": (None, "whisper-1"),
        }

        response = requests.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers=headers,
            files=files,
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            return {"text": data.get("text", "").strip()}
        else:
            raise HTTPException(status_code=response.status_code, detail=f"Transcription failed: {response.text}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server audio processing failed: {str(e)}")

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest, raw_request: Request):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Update location context if supplied
    if request.location:
        if "name" in request.location:
            USER_LOCATION["name"] = str(request.location["name"])
        if "latitude" in request.location:
            try:
                USER_LOCATION["latitude"] = float(request.location["latitude"])
            except (ValueError, TypeError):
                pass
        if "longitude" in request.location:
            try:
                USER_LOCATION["longitude"] = float(request.location["longitude"])
            except (ValueError, TypeError):
                pass

    query = request.message.strip()

    async def event_generator():
        try:
            inputs = {
                "messages": [("user", f"Location context: {USER_LOCATION['name']} (Lat: {USER_LOCATION['latitude']}, Lon: {USER_LOCATION['longitude']}). Question: {query}")]
            }

            called_tools = []
            async for event in agent.astream_events(inputs, version="v2"):
                if await raw_request.is_disconnected():
                    print("Client disconnected, stopping response generation stream.")
                    break
                kind = event["event"]
                if kind == "on_tool_start":
                    tool_name = event.get("name", "")
                    if tool_name and tool_name not in called_tools:
                        called_tools.append(tool_name)
                        payload = json.dumps({"type": "tool_start", "tool": tool_name})
                        yield f"data: {payload}\n\n"
                elif kind == "on_chat_model_stream":
                    chunk = event["data"]["chunk"]
                    content = chunk.content
                    if content:
                        if isinstance(content, list):
                            text_parts = []
                            for block in content:
                                if isinstance(block, dict) and block.get("type") == "text":
                                    text_parts.append(block.get("text", ""))
                                elif isinstance(block, str):
                                    text_parts.append(block)
                            text = "".join(text_parts)
                        else:
                            text = str(content)

                        if text:
                            payload = json.dumps({"type": "chunk", "text": text})
                            yield f"data: {payload}\n\n"

            payload = json.dumps({"type": "done", "tools": called_tools})
            yield f"data: {payload}\n\n"
        except Exception as e:
            payload = json.dumps({"type": "error", "error": str(e)})
            yield f"data: {payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
