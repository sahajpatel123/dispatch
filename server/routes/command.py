from fastapi import APIRouter, Header, HTTPException
from models.schemas import CommandRequest, CommandResponse, GoalRequest, GoalResponse
from core.state_capture import capture_state
from core.gemini_brain import call_gemini, call_gemini_reasoning
from core.executor import execute_actions
from core.action_primitives import take_screenshot, search_memory
import os
import time

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

@router.post("/goal", response_model=GoalResponse)
async def handle_goal(
    request: GoalRequest,
    x_dispatch_token: str = Header(...)
):
    verify_token(x_dispatch_token)
    
    goal = request.goal
    all_results = []
    iterations = 0
    max_iterations = 10
    memory_summary = ""
    
    # Pre-fetch recent memory for context
    try:
        memory_summary = search_memory("") # Get most recent
    except Exception as e:
        memory_summary = f"No memory available. ({e})"

    while iterations < max_iterations:
        iterations += 1
        state = capture_state()
        
        # Ask Gemini for the next step
        brain_output = call_gemini_reasoning(goal, state, memory_summary)
        
        if brain_output.get("is_achieved"):
            return GoalResponse(
                success=True,
                iterations=iterations,
                summary=brain_output.get("message", "Goal achieved!"),
                actions_executed=all_results,
                screenshot=take_screenshot()
            )
        
        actions = brain_output.get("actions", [])
        if not actions:
            break
            
        # Execute steps
        results = execute_actions(actions)
        all_results.extend(results)
        
        # Check if any action was a memory search and update context
        for res in results:
            if res["action"] == "search_memory" and res["success"]:
                # The primitive doesn't return value to executor, 
                # but we can manually re-run it for the next reasoning step
                memory_summary = search_memory(res["params"].get("query", ""))

        # Small pause for UI to settle
        time.sleep(1.0)

    return GoalResponse(
        success=False,
        iterations=iterations,
        summary="Reached iteration limit or failed to achieve goal.",
        actions_executed=all_results,
        screenshot=take_screenshot()
    )
