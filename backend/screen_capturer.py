import io
import time
import threading
import mss
import pyautogui

pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.001

try:
    import cv2
    import numpy as np
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

from PIL import Image, ImageGrab

class ScreenCapturer:
    def __init__(self):
        self._lock = threading.Lock()
        self.privacy_mode = False

    def set_privacy_mode(self, enabled: bool):
        with self._lock:
            self.privacy_mode = enabled

    def get_monitors(self):
        """Returns list of available monitors with metadata."""
        monitors = []
        try:
            with mss.mss() as sct:
                for idx, m in enumerate(sct.monitors):
                    label = "All Monitors" if idx == 0 else f"Monitor {idx}"
                    monitors.append({
                        "id": idx,
                        "name": label,
                        "left": m["left"],
                        "top": m["top"],
                        "width": m["width"],
                        "height": m["height"]
                    })
        except Exception:
            monitors = [{
                "id": 1,
                "name": "Primary Display",
                "left": 0,
                "top": 0,
                "width": 1920,
                "height": 1080
            }]
        return monitors

    def _get_target_coords(self, monitor_idx: int, x_ratio: float, y_ratio: float):
        try:
            with mss.mss() as sct:
                monitors = sct.monitors
                if monitor_idx < 0 or monitor_idx >= len(monitors):
                    monitor_idx = 1 if len(monitors) > 1 else 0

                target_monitor = monitors[monitor_idx]
                left = target_monitor["left"]
                top = target_monitor["top"]
                width = target_monitor["width"]
                height = target_monitor["height"]

                target_x = left + int(max(0.0, min(1.0, x_ratio)) * width)
                target_y = top + int(max(0.0, min(1.0, y_ratio)) * height)
                return target_x, target_y
        except Exception:
            return int(x_ratio * 1920), int(y_ratio * 1080)

    def _map_key(self, key: str) -> str:
        key_map = {
            "Backspace": "backspace",
            "Tab": "tab",
            "Enter": "enter",
            "Shift": "shift",
            "Control": "ctrl",
            "Alt": "alt",
            "Escape": "escape",
            "Space": "space",
            " ": "space",
            "ArrowLeft": "left",
            "ArrowUp": "up",
            "ArrowRight": "right",
            "ArrowDown": "down",
            "Delete": "delete",
            "Home": "home",
            "End": "end",
            "PageUp": "pageup",
            "PageDown": "pagedown",
            "CapsLock": "capslock",
        }
        return key_map.get(key, key.lower() if len(key) == 1 else key)

    def handle_input_event(self, event_data: dict, monitor_idx: int = 1):
        """Processes mouse clicks, moves, scrolls, and key presses via PyAutoGUI."""
        try:
            event_type = event_data.get("type")
            x_ratio = event_data.get("x_ratio")
            y_ratio = event_data.get("y_ratio")

            target_x, target_y = None, None
            if x_ratio is not None and y_ratio is not None:
                target_x, target_y = self._get_target_coords(monitor_idx, float(x_ratio), float(y_ratio))

            if event_type == "click":
                button = event_data.get("button", "left")
                if target_x is not None and target_y is not None:
                    pyautogui.click(target_x, target_y, button=button)

            elif event_type == "right_click":
                if target_x is not None and target_y is not None:
                    pyautogui.rightClick(target_x, target_y)

            elif event_type == "double_click":
                if target_x is not None and target_y is not None:
                    pyautogui.doubleClick(target_x, target_y)

            elif event_type == "move":
                if target_x is not None and target_y is not None:
                    pyautogui.moveTo(target_x, target_y)

            elif event_type == "mousedown":
                button = event_data.get("button", "left")
                if target_x is not None and target_y is not None:
                    pyautogui.mouseDown(target_x, target_y, button=button)

            elif event_type == "mouseup":
                button = event_data.get("button", "left")
                if target_x is not None and target_y is not None:
                    pyautogui.mouseUp(target_x, target_y, button=button)

            elif event_type == "scroll":
                delta_y = event_data.get("delta_y", 0)
                clicks = int(delta_y / 10) if delta_y != 0 else 0
                if clicks != 0:
                    if target_x is not None and target_y is not None:
                        pyautogui.scroll(clicks, x=target_x, y=target_y)
                    else:
                        pyautogui.scroll(clicks)

            elif event_type in ("press", "keydown"):
                key = event_data.get("key")
                if key:
                    pyautogui_key = self._map_key(key)
                    if pyautogui_key:
                        pyautogui.press(pyautogui_key)

            elif event_type == "type":
                text = event_data.get("text", "")
                if text:
                    pyautogui.write(text)

        except Exception as e:
            print(f"Error handling remote input event: {e}")

    def capture_frame(self, monitor_idx: int = 1, resolution: str = "720p", quality: int = 70) -> bytes:
        """
        Captures a single desktop frame, resizes it according to resolution,
        compresses it into JPEG format, and returns raw bytes. Bulletproof fallback included.
        """
        if self.privacy_mode:
            img = Image.new("RGB", (1280, 720), color=(15, 23, 42))
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=50)
            return buffer.getvalue()

        sct_img = None
        # Attempt 1: Fast MSS Capture
        try:
            with mss.mss() as sct:
                monitors = sct.monitors
                if monitor_idx < 0 or monitor_idx >= len(monitors):
                    monitor_idx = 1 if len(monitors) > 1 else 0
                target_monitor = monitors[monitor_idx]
                sct_img = sct.grab(target_monitor)
        except Exception:
            sct_img = None

        # OpenCV fast path if MSS succeeded
        if sct_img is not None and HAS_OPENCV:
            try:
                img_np = np.frombuffer(sct_img.bgra, dtype=np.uint8).reshape((sct_img.height, sct_img.width, 4))
                bgr_frame = cv2.cvtColor(img_np, cv2.COLOR_BGRA2BGR)

                orig_h, orig_w = bgr_frame.shape[0], bgr_frame.shape[1]
                target_height = None
                if resolution == "480p":
                    target_height = 480
                elif resolution == "720p":
                    target_height = 720
                elif resolution == "1080p":
                    target_height = 1080

                if target_height and orig_h > target_height:
                    aspect_ratio = orig_w / orig_h
                    new_w = int(target_height * aspect_ratio)
                    new_h = target_height
                    bgr_frame = cv2.resize(bgr_frame, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

                encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), max(10, min(100, quality))]
                success, jpeg_buffer = cv2.imencode('.jpg', bgr_frame, encode_param)
                if success:
                    return jpeg_buffer.tobytes()
            except Exception:
                pass

        # Attempt 2: PIL fallback if MSS succeeded
        if sct_img is not None:
            try:
                img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
                orig_w, orig_h = img.size
                target_height = None
                if resolution == "480p":
                    target_height = 480
                elif resolution == "720p":
                    target_height = 720
                elif resolution == "1080p":
                    target_height = 1080

                if target_height and orig_h > target_height:
                    aspect_ratio = orig_w / orig_h
                    new_w = int(target_height * aspect_ratio)
                    new_h = target_height
                    img = img.resize((new_w, new_h), Image.Resampling.BILINEAR)

                buffer = io.BytesIO()
                img.save(buffer, format="JPEG", quality=max(10, min(100, quality)), optimize=False)
                return buffer.getvalue()
            except Exception:
                pass

        # Attempt 3: PIL ImageGrab direct fallback
        try:
            img = ImageGrab.grab()
            orig_w, orig_h = img.size
            target_height = None
            if resolution == "480p":
                target_height = 480
            elif resolution == "720p":
                target_height = 720
            elif resolution == "1080p":
                target_height = 1080

            if target_height and orig_h > target_height:
                aspect_ratio = orig_w / orig_h
                new_w = int(target_height * aspect_ratio)
                new_h = target_height
                img = img.resize((new_w, new_h), Image.Resampling.BILINEAR)

            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=max(10, min(100, quality)), optimize=False)
            return buffer.getvalue()
        except Exception:
            pass

        # Attempt 4: Fallback placeholder slate
        img = Image.new("RGB", (1280, 720), color=(15, 23, 42))
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=50)
        return buffer.getvalue()

# Global capturer instance
capturer = ScreenCapturer()
