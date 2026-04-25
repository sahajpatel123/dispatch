import json
import logging
from datetime import datetime
from pathlib import Path
from core.action_primitives import (
    focus_window, open_app, close_app, minimize_window, maximize_window,
    switch_app, get_window_list, get_active_window,
    click, right_click, double_click, middle_click, move_to, drag, scroll, hover,
    type_text, type_text_paste, key_press, key_down, key_up, hotkey,
    read_clipboard, write_clipboard, paste, copy, cut, select_all,
    take_screenshot, take_screenshot_region, get_screen_resolution,
    run_shell, open_terminal, run_in_terminal, run_in_any_terminal,
    insert_text_into_app,
    focus_gemini_terminal, send_to_gemini,
    sleep, get_running_processes, kill_process, lock_screen, get_battery_status
)

LOG_PATH = Path("logs/action_history.json")
LOG_PATH.parent.mkdir(exist_ok=True)

ACTION_MAP = {
    # Window
    "focus_window": focus_window,
    "open_app": open_app,
    "close_app": close_app,
    "minimize_window": minimize_window,
    "maximize_window": maximize_window,
    "switch_app": switch_app,
    "get_window_list": get_window_list,
    "get_active_window": get_active_window,
    # Mouse
    "click": click,
    "right_click": right_click,
    "double_click": double_click,
    "middle_click": middle_click,
    "move_to": move_to,
    "drag": drag,
    "scroll": scroll,
    "hover": hover,
    # Keyboard
    "type_text": type_text,
    "type_text_paste": type_text_paste,
    "key_press": key_press,
    "key_down": key_down,
    "key_up": key_up,
    "hotkey": hotkey,
    # Clipboard
    "read_clipboard": read_clipboard,
    "write_clipboard": write_clipboard,
    "paste": paste,
    "copy": copy,
    "cut": cut,
    "select_all": select_all,
    # Screenshot
    "take_screenshot": take_screenshot,
    "take_screenshot_region": take_screenshot_region,
    "get_screen_resolution": get_screen_resolution,
    # Shell
    "run_shell": run_shell,
    "open_terminal": open_terminal,
    "run_in_terminal": run_in_terminal,
    "run_in_any_terminal": run_in_any_terminal,
    # Generic Injection
    "insert_text_into_app": insert_text_into_app,
    # Gemini CLI
    "focus_gemini_terminal": focus_gemini_terminal,
    "send_to_gemini": send_to_gemini,
    # System
    "sleep": sleep,
    "get_running_processes": get_running_processes,
    "kill_process": kill_process,
    "lock_screen": lock_screen,
    "get_battery_status": get_battery_status,
}


def execute_actions(action_list: list) -> list:
    """Execute a list of action dicts. Returns log of results."""
    results = []
    for item in action_list:
        action_name = item.get("action")
        params = item.get("params", {})
        timestamp = datetime.now().isoformat()
        log_entry = {
            "action": action_name,
            "params": params,
            "timestamp": timestamp,
            "success": False,
            "error": None
        }
        if action_name not in ACTION_MAP:
            log_entry["error"] = f"Unknown action: {action_name}"
            results.append(log_entry)
            continue
        try:
            ACTION_MAP[action_name](**params)
            log_entry["success"] = True
            # Mandatory sleep between every action for macOS stability
            time.sleep(0.4) 
        except Exception as e:
            log_entry["error"] = str(e)
            logging.error(f"Action {action_name} failed: {e}")

        results.append(log_entry)
        append_to_history(log_entry)

    return results


def append_to_history(entry: dict):
    """Append action to persistent JSON log"""
    history = []
    if LOG_PATH.exists():
        try:
            history = json.loads(LOG_PATH.read_text())
        except Exception:
            history = []
    history.append(entry)
    # Keep last 500 entries only
    history = history[-500:]
    LOG_PATH.write_text(json.dumps(history, indent=2))
