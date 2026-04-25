from fastapi import APIRouter, Header, HTTPException
from models.schemas import RawExecuteRequest
from core.executor import execute_actions
import os

router = APIRouter()

@router.post("/execute-raw")
async def execute_raw(
    request: RawExecuteRequest,
    x_dispatch_token: str = Header(...)
):
    if x_dispatch_token != os.getenv("SECRET_TOKEN"):
        raise HTTPException(status_code=403)

    actions = [a.dict() for a in request.actions]
    results = execute_actions(actions)
    return {"success": True, "results": results}
