import subprocess
import json
import logging

AVAILABLE_ACTIONS = """
focus_window(title_substring: str)
open_app(app_name: str)
close_app(app_name: str)
minimize_window(app_name: str)
maximize_window(app_name: str)
switch_app(app_name: str)
get_window_list()
get_active_window()
click(x: int, y: int)
right_click(x: int, y: int)
double_click(x: int, y: int)
drag(x1: int, y1: int, x2: int, y2: int)
scroll(x: int, y: int, direction: str, amount: int)
hover(x: int, y: int, duration: float)
move_to(x: int, y: int)
type_text(text: str)
type_text_paste(text: str)
key_press(keys: str)
key_down(key: str)
key_up(key: str)
hotkey(*keys)
read_clipboard()
write_clipboard(text: str)
paste()
copy()
cut()
select_all()
take_screenshot()
run_shell(command: str)
open_terminal()
run_in_terminal(command: str)
insert_text_into_app(app_name: str, text: str)
focus_gemini_terminal()
send_to_gemini(prompt: str)
sleep(seconds: float)
kill_process(name: str)
lock_screen()
get_battery_status()
"""

SYSTEM_PROMPT = """
You are a laptop automation agent. You control a macOS laptop by returning a JSON object containing a conversational message and an array of actions to execute in order.

RULES — READ CAREFULLY:
1. Return ONLY a raw JSON object. No explanation. No markdown. No code fences. No text before or after.
2. The JSON object must have exactly two keys: 
   - "message": A short, friendly confirmation of what you are doing (e.g., "Sure, inserting your text into Cursor now.")
   - "actions": An array of objects, each with "action" (string) and "params" (object).
3. If a param is not needed, use an empty object: {}.
4. Use sleep actions between steps that need time to load (open_app needs 1.5s, focus switches need 0.3s).
5. For complex text insertion: You MUST use the `insert_text_into_app` action. Do NOT try to use hotkeys to paste large blocks of code.
6. When the user asks you to "paste this" or "write this" into an app (e.g., Cursor, Notes, Chrome), extract the text they want pasted and use `insert_text_into_app(app_name="Cursor", text="<the text>")`.
7. key_press values use + for combos: "cmd+v", "cmd+shift+p", "enter", "escape", "tab".

AVAILABLE ACTIONS:
__ACTIONS__

CURRENT LAPTOP STATE:
Active Window: __ACTIVE_WINDOW__
Open Windows: __WINDOW_LIST__
Clipboard (first 300 chars): __CLIPBOARD__
Screen Resolution: __RESOLUTION__

USER COMMAND: __COMMAND__

Return the JSON object now:
""".strip()


def call_gemini(command: str, state: dict) -> dict:
    """
    Send command + laptop state to Gemini CLI.
    Returns dict with "message" (str) and "actions" (list).
    """
    prompt = SYSTEM_PROMPT \
        .replace("__ACTIONS__", AVAILABLE_ACTIONS) \
        .replace("__ACTIVE_WINDOW__", state.get("active_window", "unknown")) \
        .replace("__WINDOW_LIST__", ", ".join(state.get("window_list", []))) \
        .replace("__CLIPBOARD__", state.get("clipboard", "")[:300]) \
        .replace("__RESOLUTION__", str(state.get("screen_resolution", [0, 0]))) \
        .replace("__COMMAND__", command)

    try:
        result = subprocess.run(
            ["gemini", "-p", prompt],
            capture_output=True,
            text=True,
            timeout=45
        )
        raw = result.stdout.strip()

        # Strip markdown fences if Gemini wraps in them
        raw = raw.replace("```json", "").replace("```", "").strip()

        # Find the JSON object — start from first {
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1:
            raw = raw[start:end+1]

        data = json.loads(raw)
        return {
            "message": data.get("message", "Processing your request..."),
            "actions": data.get("actions", [])
        }

    except subprocess.TimeoutExpired:
        logging.error("Gemini CLI timed out")
        return {"message": "Request timed out", "actions": []}
    except json.JSONDecodeError as e:
        logging.error(f"Gemini returned invalid JSON: {e}\nRaw output: {raw}")
        return {"message": "Failed to parse response", "actions": []}
    except Exception as e:
        logging.error(f"Gemini brain error: {e}")
        return {"message": "An error occurred", "actions": []}
