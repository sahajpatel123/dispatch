from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class CommandRequest(BaseModel):
    command: str

class ActionItem(BaseModel):
    action: str
    params: Dict[str, Any] = {}

class RawExecuteRequest(BaseModel):
    actions: List[ActionItem]

class ActionLog(BaseModel):
    action: str
    params: Dict[str, Any]
    timestamp: str
    success: bool
    error: Optional[str] = None

class LaptopState(BaseModel):
    active_window: str
    window_list: List[str]
    clipboard: str
    screen_resolution: List[int]
    timestamp: str

class CommandResponse(BaseModel):
    success: bool
    actions_executed: List[ActionLog]
    message: Optional[str] = None
    screenshot: Optional[str] = None
    error: Optional[str] = None

class GoalRequest(BaseModel):
    goal: str

class GoalResponse(BaseModel):
    success: bool
    iterations: int
    summary: str
    actions_executed: List[ActionLog]
    screenshot: Optional[str] = None
