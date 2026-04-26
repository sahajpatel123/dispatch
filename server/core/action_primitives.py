import pyautogui
import pyperclip
import subprocess
import psutil
import time
import os
from PIL import Image
import mss
import io
import base64
import re

pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.1


# ─── NATIVE MACOS COMMAND HELPERS ──────────────────────────────────────────

def run_applescript(script: str):
    """Execute a native AppleScript for 100% reliable UI control"""
    try:
        subprocess.run(["osascript", "-e", script], check=True, capture_output=True)
    except Exception as e:
        print(f"AppleScript Error: {e}")


def inject_text_to_focused_element(text: str):
    """
    The 'New Way': Direct buffer injection.
    Takes string 'x' and places it directly into the intended UI element.
    Bypasses keyboard, modifiers, and menu bars.
    """
    safe_text = text.replace('"', '\\"').replace('\n', '\\n')
    script = f'''
    tell application "System Events"
        set frontApp to first application process whose frontmost is true
        tell frontApp
            try
                set focusedElement to first element of (entire contents of window 1) whose focused is true
                set value of focusedElement to "{safe_text}"
                return "SUCCESS"
            on error
                return "FALLBACK"
            end try
        end tell
    end tell
    '''
    result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True).stdout.strip()
    
    if "FALLBACK" in result or "SUCCESS" not in result:
        # High-priority native paste helper as fallback
        process = subprocess.Popen(['pbcopy'], stdin=subprocess.PIPE)
        process.communicate(text.encode('utf-8'))
        time.sleep(0.2)
        run_applescript('tell application "System Events" to key code 9 using command down')


# ─── WINDOW MANAGEMENT ───────────────────────────────────────────────────────

def focus_window(title_substring: str):
    script = f'''
    tell application "System Events"
        set targetProc to first process whose name contains "{title_substring}"
        set frontmost of targetProc to true
    end tell
    '''
    run_applescript(script)
    time.sleep(0.5)


def open_app(app_name: str):
    subprocess.run(["open", "-a", app_name])
    time.sleep(2.0)


def close_app(app_name: str):
    run_applescript(f'tell application "{app_name}" to quit')


def minimize_window(app_name: str):
    script = f'tell application "{app_name}" to set miniaturized of front window to true'
    run_applescript(script)


def maximize_window(app_name: str):
    script = f'tell application "{app_name}" to set zoomed of front window to true'
    run_applescript(script)


def switch_app(app_name: str):
    open_app(app_name)


def get_window_list() -> list:
    script = 'tell application "System Events" to get name of every process whose background only is false'
    result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
    raw = result.stdout.strip()
    return [a.strip() for a in raw.split(",") if a.strip()]


def get_active_window() -> str:
    script = 'tell application "System Events" to get name of first process whose frontmost is true'
    result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
    return result.stdout.strip()


# ─── MOUSE ACTIONS ────────────────────────────────────────────────────────────

def click(x: int, y: int):
    pyautogui.click(x, y)

def right_click(x: int, y: int):
    pyautogui.rightClick(x, y)

def double_click(x: int, y: int):
    pyautogui.doubleClick(x, y)

def middle_click(x: int, y: int):
    pyautogui.middleClick(x, y)

def move_to(x: int, y: int):
    pyautogui.moveTo(x, y)

def drag(x1: int, y1: int, x2: int, y2: int):
    pyautogui.drag(x1, y1, x2 - x1, y2 - y1, duration=0.3)

def scroll(x: int, y: int, direction: str, amount: int = 3):
    pyautogui.moveTo(x, y)
    clicks = amount if direction == "up" else -amount
    pyautogui.scroll(clicks)

def hover(x: int, y: int, duration: float = 0.5):
    pyautogui.moveTo(x, y, duration=duration)


# ─── KEYBOARD ACTIONS ────────────────────────────────────────────────────────

def type_text(text: str):
    if len(text) > 10 or "\n" in text or re.search(r'[^a-zA-Z0-9 ]', text):
        inject_text_to_focused_element(text)
    else:
        pyautogui.typewrite(text, interval=0.02)

def type_text_paste(text: str):
    inject_text_to_focused_element(text)

def key_press(keys: str):
    codes = {'v': 9, 'c': 8, 'x': 7, 'a': 0, 'i': 34, 'l': 37, 'enter': 36, 'escape': 53, 'tab': 48}
    if "+" in keys:
        parts = keys.lower().split("+")
        main_char = parts[-1]
        mods = []
        if "cmd" in parts or "command" in parts: mods.append("command down")
        if "shift" in parts: mods.append("shift down")
        if main_char in codes:
            code = codes[main_char]
            run_applescript(f'tell application "System Events" to key code {code} using {"{" + ", ".join(mods) + "}"}')
        else:
            pyautogui.hotkey(*parts)
    else:
        if keys.lower() in codes:
            run_applescript(f'tell application "System Events" to key code {codes[keys.lower()]}')
        else:
            pyautogui.press(keys)

def key_down(key: str):
    pyautogui.keyDown(key)

def key_up(key: str):
    pyautogui.keyUp(key)

def hotkey(*keys):
    pyautogui.hotkey(*keys)


# ─── CLIPBOARD ────────────────────────────────────────────────────────────────

def read_clipboard() -> str:
    return pyperclip.paste()

def write_clipboard(text: str):
    pyperclip.copy(text)

def paste():
    run_applescript('tell application "System Events" to key code 9 using command down')

def copy():
    run_applescript('tell application "System Events" to key code 8 using command down')

def cut():
    run_applescript('tell application "System Events" to key code 7 using command down')

def select_all():
    run_applescript('tell application "System Events" to key code 0 using command down')


# ─── SCREENSHOT ───────────────────────────────────────────────────────────────

def take_screenshot(resize_width: int = 1024) -> str:
    with mss.mss() as sct:
        monitor = sct.monitors[1]
        raw = sct.grab(monitor)
        img = Image.frombytes("RGB", raw.size, raw.bgra, "raw", "BGRX")
    ratio = resize_width / img.width
    new_height = int(img.height * ratio)
    img = img.resize((resize_width, new_height), Image.LANCZOS)
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=60)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

def take_screenshot_region(x: int, y: int, w: int, h: int) -> str:
    with mss.mss() as sct:
        region = {"top": y, "left": x, "width": w, "height": h}
        raw = sct.grab(region)
        img = Image.frombytes("RGB", raw.size, raw.bgra, "raw", "BGRX")
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=70)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

def get_screen_resolution() -> list:
    import mss
    with mss.mss() as sct:
        m = sct.monitors[1]
        return [m["width"], m["height"]]


# ─── SHELL / TERMINAL ─────────────────────────────────────────────────────────

def run_shell(command: str) -> str:
    result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
    return result.stdout + result.stderr

def open_terminal():
    subprocess.run(["open", "-a", "Terminal"])
    time.sleep(1.0)

def run_in_terminal(command: str):
    focus_window("Terminal")
    time.sleep(0.4)
    type_text_paste(command)
    time.sleep(0.2)
    pyautogui.press("enter")

def run_in_any_terminal(command: str):
    script = f'tell application "Terminal" to do script "{command}" in front window'
    run_applescript(script)


# ─── SMART INTERACTION ────────────────────────────────────────────────────

def smart_search(app_name: str, query: str):
    """
    Intelligent search that knows the specific shortcuts for every app.
    """
    focus_window(app_name)
    app = app_name.lower()
    
    # 1. Trigger the search/address bar shortcut
    if any(x in app for x in ["safari", "chrome", "arc", "browser"]):
        key_press("cmd+l")
    elif any(x in app for x in ["cursor", "vscode", "code"]):
        key_press("cmd+l")
    elif "finder" in app:
        key_press("cmd+f")
    elif "notes" in app:
        key_press("cmd+alt+f")
    elif "spotify" in app:
        key_press("cmd+l")
    
    time.sleep(0.4)
    # 2. Inject the query and hit enter
    inject_text_to_focused_element(query)
    time.sleep(0.2)
    key_press("enter")


def click_element(app_name: str, element_name: str):
    """Clicks a UI element by its name using Accessibility API"""
    script = f'''
    tell application "System Events"
        tell process "{app_name}"
            set frontmost to true
            try
                click (first element of (entire contents of window 1) whose name contains "{element_name}")
                return "SUCCESS"
            on error
                return "NOT_FOUND"
            end try
        end tell
    end tell
    '''
    run_applescript(script)


# ─── GENERIC TEXT INJECTION ────────────────────────────────────────────────

def insert_text_into_app(app_name: str, text: str):
    """
    Improved generic injection:
    1. Focuses the target app.
    2. If it's a known app (Cursor, Safari, etc.), triggers the 'Focus Input' shortcut.
    3. Injects the text string directly.
    """
    focus_window(app_name)
    app = app_name.lower()
    
    # Proactively focus the input area for common apps
    if any(x in app for x in ["cursor", "vscode", "safari", "chrome", "arc", "browser", "spotify"]):
        # Hardware key code for Cmd+L (Focus Address/Search/Chat)
        run_applescript('tell application "System Events" to key code 37 using command down')
        time.sleep(0.4)
    
    inject_text_to_focused_element(text)


# ─── GEMINI CLI SPECIFIC ─────────────────────────────────────────────────────

def focus_gemini_terminal():
    focus_window("Terminal")

def send_to_gemini(prompt: str):
    focus_window("Terminal")
    time.sleep(0.4)
    type_text_paste(prompt)
    time.sleep(0.2)
    pyautogui.press("enter")


# ─── SYSTEM ──────────────────────────────────────────────────────────────────

def sleep(seconds: float):
    time.sleep(seconds)

def get_running_processes() -> list:
    return [p.name() for p in psutil.process_iter(["name"])]

def kill_process(name: str):
    for proc in psutil.process_iter(["name"]):
        if name.lower() in proc.name().lower():
            proc.kill()

def lock_screen():
    run_applescript('tell application "System Events" to keystroke "q" using {control down, command down}')

def get_battery_status() -> dict:
    battery = psutil.sensors_battery()
    if battery:
        return {"percent": battery.percent, "plugged": battery.power_plugged}
    return {"percent": "unknown", "plugged": "unknown"}
