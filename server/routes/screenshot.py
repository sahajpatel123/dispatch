from fastapi import APIRouter, Header, HTTPException
from core.action_primitives import take_screenshot
import os

router = APIRouter()

@router.get("/screenshot")
async def get_screenshot(x_dispatch_token: str = Header(...)):
    if x_dispatch_token != os.getenv("SECRET_TOKEN"):
        raise HTTPException(status_code=403)
    return {"screenshot": take_screenshot(), "timestamp": __import__('datetime').datetime.now().isoformat()}
