from fastapi import APIRouter, Header, HTTPException
from core.state_capture import capture_state
import os

router = APIRouter()

@router.get("/state")
async def get_state(x_dispatch_token: str = Header(...)):
    if x_dispatch_token != os.getenv("SECRET_TOKEN"):
        raise HTTPException(status_code=403)
    return capture_state()
