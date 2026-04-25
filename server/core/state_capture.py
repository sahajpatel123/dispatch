import pyperclip
from datetime import datetime
from core.action_primitives import (
    get_window_list, get_active_window,
    take_screenshot, get_screen_resolution
)

def capture_state() -> dict:
    """Capture full current state of the laptop"""
    try:
        active = get_active_window()
    except Exception:
        active = "unknown"

    try:
        windows = get_window_list()
    except Exception:
        windows = []

    try:
        clipboard = pyperclip.paste()
        if len(clipboard) > 500:
            clipboard = clipboard[:500] + "... [truncated]"
    except Exception:
        clipboard = ""

    try:
        resolution = get_screen_resolution()
    except Exception:
        resolution = [0, 0]

    return {
        "active_window": active,
        "window_list": windows,
        "clipboard": clipboard,
        "screen_resolution": resolution,
        "timestamp": datetime.now().isoformat()
    }
