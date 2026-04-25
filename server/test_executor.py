from core.executor import execute_actions

actions = [
    {"action": "sleep", "params": {"seconds": 0.5}},
    {"action": "write_clipboard", "params": {"text": "executor working"}},
    {"action": "read_clipboard", "params": {}}
]

results = execute_actions(actions)
for r in results:
    print(r)
