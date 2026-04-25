from core.state_capture import capture_state
from core.gemini_brain import call_gemini
from core.executor import execute_actions

state = capture_state()
print("State captured:", state["active_window"])

actions = call_gemini("open calculator app", state)
print("Gemini returned actions:", actions)

if actions:
    results = execute_actions(actions)
    print("Execution results:", results)
