from core.action_primitives import (
    get_window_list, get_active_window,
    take_screenshot, write_clipboard, read_clipboard,
    focus_window, sleep
)

print("Windows:", get_window_list())
print("Active:", get_active_window())
print("Resolution:", __import__('core.action_primitives', fromlist=['get_screen_resolution']).get_screen_resolution())

write_clipboard("primitives test")
print("Clipboard:", read_clipboard())

screenshot = take_screenshot()
print("Screenshot length (chars):", len(screenshot))
