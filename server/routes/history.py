from fastapi import APIRouter, Header, HTTPException
from pathlib import Path
import json, os

router = APIRouter()

@router.get("/history")
async def get_history(x_dispatch_token: str = Header(...)):
    if x_dispatch_token != os.getenv("SECRET_TOKEN"):
        raise HTTPException(status_code=403)
    path = Path("logs/action_history.json")
    if not path.exists():
        return {"history": []}
    return {"history": json.loads(path.read_text())}
