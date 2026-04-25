from fastapi import APIRouter
from datetime import datetime

router = APIRouter()
START_TIME = datetime.now()

@router.get("/health")
async def health():
    uptime = datetime.now() - START_TIME
    hours, remainder = divmod(int(uptime.total_seconds()), 3600)
    minutes, _ = divmod(remainder, 60)
    return {
        "status": "running",
        "uptime": f"{hours}h {minutes}m",
        "started_at": START_TIME.isoformat()
    }
