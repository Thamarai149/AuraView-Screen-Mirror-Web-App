import asyncio
import json
import logging
import random
import socket
import time
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, HTMLResponse, FileResponse
from screen_capturer import capturer
from audio_capturer import audio_capturer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ScreenMirroring")

app = FastAPI(
    title="Real-Time Screen Mirroring & Audio Stream API",
    description="High-performance desktop screen & audio capture stream backend with dynamic PIN security.",
    version="2.2.0"
)

# Helper to get local network IPv4 address
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

# Dynamic 4-Digit Security PIN Manager
current_pin = str(random.randint(1000, 9999))
logger.info(f"Initial Security PIN generated: {current_pin}")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/pin")
@app.get("/pin.html")
async def serve_pin_html():
    """Serves the standalone PIN generator HTML page."""
    html_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "pin.html"))
    if os.path.exists(html_path):
        return FileResponse(html_path)
    return HTMLResponse("<h1>PIN Page Not Found</h1>", status_code=404)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time(), "pin_protected": True}

@app.get("/api/pin-info")
async def get_pin_info():
    """Returns current active PIN and local IP address for host guide UI."""
    return {
        "status": "success",
        "pin": current_pin,
        "host_ip": get_local_ip(),
        "port": 5173
    }

@app.post("/api/refresh-pin")
async def refresh_pin():
    """Generates a new random 4-digit PIN dynamically."""
    global current_pin
    current_pin = str(random.randint(1000, 9999))
    logger.info(f"Security PIN refreshed to: {current_pin}")
    return {
        "status": "success",
        "new_pin": current_pin,
        "message": "Security PIN successfully updated"
    }

@app.post("/api/verify-pin")
async def verify_pin(payload: dict = Body(...)):
    pin_input = str(payload.get("pin", "")).strip()
    if pin_input == current_pin:
        return {"status": "success", "authenticated": True, "message": "PIN verified successfully"}
    else:
        raise HTTPException(status_code=401, detail="Invalid 4-digit PIN code")

@app.get("/api/monitors")
async def get_monitors():
    try:
        monitors = capturer.get_monitors()
        return {"status": "success", "monitors": monitors}
    except Exception as e:
        logger.error(f"Error fetching monitors: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket video client connected")

    # Client streaming settings
    state = {
        "authenticated": False,
        "resolution": "720p",
        "fps": 30,
        "quality": 70,
        "monitor": 1,
        "active": True,
        "privacy_mode": False
    }

    async def receive_controls():
        """Listen for JSON control messages and remote input events from the client."""
        nonlocal state
        try:
            while True:
                data_str = await websocket.receive_text()
                data = json.loads(data_str)
                action = data.get("action")
                
                if action == "auth":
                    pin = str(data.get("pin", "")).strip()
                    if pin == current_pin:
                        state["authenticated"] = True
                        await websocket.send_text(json.dumps({"type": "auth_result", "success": True}))
                        logger.info("Client authenticated via PIN")
                    else:
                        await websocket.send_text(json.dumps({"type": "auth_result", "success": False, "error": "Invalid PIN"}))
                        logger.warning(f"Client failed PIN authentication (Received {pin}, expected {current_pin})")

                elif action == "configure":
                    if "resolution" in data:
                        state["resolution"] = data["resolution"]
                    if "fps" in data:
                        state["fps"] = max(1, min(60, int(data["fps"])))
                    if "quality" in data:
                        state["quality"] = max(10, min(100, int(data["quality"])))
                    if "monitor" in data:
                        state["monitor"] = int(data["monitor"])

                elif action == "toggle_privacy":
                    enabled = bool(data.get("enabled", False))
                    state["privacy_mode"] = enabled
                    capturer.set_privacy_mode(enabled)

                elif action == "input_event" and state["authenticated"]:
                    event_data = data.get("event")
                    if event_data:
                        await asyncio.to_thread(
                            capturer.handle_input_event,
                            event_data=event_data,
                            monitor_idx=state["monitor"]
                        )

                elif action == "pause":
                    state["active"] = False

                elif action == "resume":
                    state["active"] = True

        except WebSocketDisconnect:
            pass
        except Exception as e:
            logger.warning(f"WebSocket control listener ended: {e}")

    # Launch control listener in background task
    control_task = asyncio.create_task(receive_controls())

    try:
        while True:
            start_time = time.time()

            if state["active"] and state["authenticated"]:
                try:
                    frame_bytes = await asyncio.to_thread(
                        capturer.capture_frame,
                        monitor_idx=state["monitor"],
                        resolution=state["resolution"],
                        quality=state["quality"]
                    )
                    await websocket.send_bytes(frame_bytes)
                except (WebSocketDisconnect, RuntimeError):
                    logger.info("WebSocket video client disconnected")
                    break
                except Exception as e:
                    logger.error(f"Error capturing frame: {e}")
                    await asyncio.sleep(0.5)
                    continue

            target_delay = 1.0 / state["fps"]
            elapsed = time.time() - start_time
            sleep_time = max(0.001, target_delay - elapsed)
            await asyncio.sleep(sleep_time)

    except WebSocketDisconnect:
        logger.info("WebSocket video client disconnected")
    except Exception as e:
        logger.error(f"WebSocket video stream error: {e}")
    finally:
        control_task.cancel()

@app.websocket("/ws/audio")
async def websocket_audio_stream(websocket: WebSocket):
    """Live desktop PC speaker WASAPI loopback audio stream endpoint."""
    await websocket.accept()
    logger.info("WebSocket audio client connected")
    try:
        while True:
            pcm_bytes = audio_capturer.capture_pcm_chunk(2048)
            if pcm_bytes:
                await websocket.send_bytes(pcm_bytes)
            await asyncio.sleep(0.02)
    except (WebSocketDisconnect, RuntimeError):
        logger.info("WebSocket audio client disconnected")
    except Exception as e:
        logger.error(f"WebSocket audio stream error: {e}")

def generate_mjpeg_frames(monitor: int, resolution: str, quality: int, fps: int):
    """Generator for HTTP MJPEG stream response."""
    delay = 1.0 / fps
    while True:
        start_time = time.time()
        try:
            frame_bytes = capturer.capture_frame(
                monitor_idx=monitor,
                resolution=resolution,
                quality=quality
            )
            yield (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n'
            )
        except Exception as e:
            logger.error(f"MJPEG stream error: {e}")
            time.sleep(0.5)

        elapsed = time.time() - start_time
        time.sleep(max(0.001, delay - elapsed))

@app.get("/api/stream")
async def mjpeg_stream(
    monitor: int = Query(1, ge=0),
    resolution: str = Query("720p"),
    quality: int = Query(70, ge=10, le=100),
    fps: int = Query(30, ge=1, le=60)
):
    """Fallback MJPEG HTTP video stream endpoint."""
    return StreamingResponse(
        generate_mjpeg_frames(monitor, resolution, quality, fps),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
