import os
import uvicorn
import qrcode
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pyngrok import ngrok

from routes.command import router as command_router
from routes.state import router as state_router
from routes.screenshot import router as screenshot_router
from routes.history import router as history_router
from routes.execute_raw import router as execute_raw_router
from routes.health import router as health_router

load_dotenv()

app = FastAPI(title="Personal Dispatch", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(command_router)
app.include_router(state_router)
app.include_router(screenshot_router)
app.include_router(history_router)
app.include_router(execute_raw_router)
app.include_router(health_router)

@app.get("/")
async def root():
    return {"message": "Dispatch Server is Online"}



def start_tunnel() -> str:
    token = os.getenv("NGROK_TOKEN")
    if not token:
        print("No NGROK_TOKEN found. Running LAN only.")
        return None
    ngrok.set_auth_token(token)
    # Using your static domain from Ngrok
    tunnel = ngrok.connect(8000, domain="marmalade-coerce-eternal.ngrok-free.dev")
    url = tunnel.public_url
    return url


def print_qr(url: str):
    """Print QR code in terminal for phone to scan"""
    qr = qrcode.QRCode()
    qr.add_data(url)
    qr.make()
    qr.print_ascii(invert=True)
    print(f"\nDispatch URL: {url}\n")


if __name__ == "__main__":
    print("\n=== Personal Dispatch Starting ===\n")

    public_url = start_tunnel()
    if public_url:
        print_qr(public_url)
        # Save URL for phone app convenience
        with open("tunnel_url.txt", "w") as f:
            f.write(public_url)
    else:
        import socket
        lan_ip = socket.gethostbyname(socket.gethostname())
        print(f"LAN URL: http://{lan_ip}:{os.getenv('PORT', 8000)}")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False
    )
