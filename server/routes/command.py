from fastapi import APIRouter, Header, HTTPException
from models.schemas import CommandRequest, CommandResponse
from core.state_capture import capture_state
from core.gemini_brain import call_gemini
from core.executor import execute_actions
from core.action_primitives import take_screenshot
import os

router = APIRouter()

def verify_token(x_dispatch_token: str = Header(...)):
    if x_dispatch_token != os.getenv("SECRET_TOKEN"):
        raise HTTPException(status_code=403, detail="Unauthorized")

@router.post("/command", response_model=CommandResponse)
async def handle_command(
    request: CommandRequest,
    x_dispatch_token: str = Header(...)
):
    verify_token(x_dispatch_token)

    # 1. Capture current laptop state
    state = capture_state()

    # 2. Ask Gemini what to do
    brain_output = call_gemini(request.command, state)
    
    action_list = brain_output.get("actions", [])
    message = brain_output.get("message", "Processing...")

    if not action_list and not message:
        return CommandResponse(
            success=False,
            actions_executed=[],
            error="Gemini returned no actions"
        )

    # 3. Execute the actions
    results = execute_actions(action_list)

    # 4. Take a final screenshot to confirm
    screenshot = take_screenshot()

    return CommandResponse(
        success=True,
        actions_executed=results,
        message=message,
        screenshot=screenshot
    )
