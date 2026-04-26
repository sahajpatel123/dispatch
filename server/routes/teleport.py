from fastapi import APIRouter, Header, HTTPException
from core.action_primitives import ghost_click, get_app_context
from pydantic import BaseModel
import os

router = APIRouter()

class GhostClickRequest(BaseModel):
    x_percent: float
    y_percent: float
    type: str = "left"

def verify(token):
    if token != os.getenv("SECRET_TOKEN"):
        raise HTTPException(status_code=403)

@router.post("/ghost-click")
async def handle_ghost_click(req: GhostClickRequest, x_dispatch_token: str = Header(...)):
    verify(x_dispatch_token)
    ghost_click(req.x_percent, req.y_percent, req.type)
    return {"success": True}

@router.get("/teleport")
async def handle_teleport(x_dispatch_token: str = Header(...)):
    verify(x_dispatch_token)
    return get_app_context()
