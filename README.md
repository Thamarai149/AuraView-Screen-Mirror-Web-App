# ⚡ AuraView — Real-Time Screen Mirroring & Audio Streaming

![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white) ![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)

**High-performance desktop screen & audio streaming — access your PC from any device on the same Wi-Fi network via browser. No apps, no installs on mobile.**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🖥️ **Real-Time Screen Stream** | Live desktop video stream via WebSocket at up to 60 FPS |
| 🔊 **PC Audio Streaming** | WASAPI loopback — hear PC sound on mobile browser in real-time |
| 🔐 **Dynamic PIN Security** | Auto-generated 4-digit PIN per session, refresh anytime |
| 🖱️ **Remote Mouse & Keyboard** | Control PC mouse, keyboard, clicks, scroll from mobile touch |
| 🔒 **Privacy Freeze Mode** | Instantly hide screen feed from remote viewer |
| 📷 **Snapshot Download** | One-click screenshot download from live stream |
| 🔄 **Screen Rotation** | Rotate stream 0°, 90°, 180°, 270° for landscape/portrait |
| 📐 **Aspect Ratio Modes** | Best Fit, Fit Screen, Fill, 16:9, 4:3, Center, Notch Safe Area |
| 📱 **Mobile Notch Support** | viewport-fit=cover + safe-area-inset padding for notch phones |
| 🖥️ **Multi-Monitor Support** | Select and switch between multiple connected monitors |
| 📊 **Live Stats Bar** | Real-time FPS, Frame Latency, Bitrate Speed, Uptime |
| 🎧 **Bluetooth Audio** | Auto-detects active Windows audio output including Bluetooth |

---

## 🛠️ Tech Stack

### Backend
- **Python 3.10+**
- **FastAPI** + **Uvicorn** — async WebSocket server
- **MSS** — ultra-fast multi-monitor screen capture
- **SoundCard** — WASAPI loopback audio capture (Windows)
- **Pillow / OpenCV** — JPEG frame compression and encoding
- **PyAutoGUI** — remote mouse & keyboard control
- **NumPy** — PCM audio buffer processing

### Frontend
- **React 18** + **Vite 5**
- **TailwindCSS v4** — utility-first styling
- **Web Audio API** — real-time PCM audio decoding & playback
- **HTML5 Canvas** — zero-latency video frame rendering
- **WebSocket** — bidirectional video + audio + control streams
- **Lucide React** — icon library
- **Google Fonts** — Inter, Outfit, JetBrains Mono

---

## 📂 Project Structure

```
Screen/
├── backend/
│   ├── main.py              # FastAPI server — WebSocket video, audio & control endpoints
│   ├── screen_capturer.py   # MSS screen capture, JPEG encoding, remote input handling
│   ├── audio_capturer.py    # WASAPI loopback audio — dynamic Bluetooth support
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── public/
│   │   └── pin.html         # Standalone PIN page
│   ├── src/
│   │   ├── components/
│   │   │   ├── StreamViewer.jsx   # Canvas renderer, rotation, aspect ratio fit modes
│   │   │   ├── ControlPanel.jsx   # Stream controls, rotation, aspect ratio selectors
│   │   │   ├── StatsBar.jsx       # Live diagnostics bar
│   │   │   ├── Header.jsx
│   │   │   └── PinLockModal.jsx   # PIN authentication modal
│   │   ├── App.jsx           # Main app state & WebSocket management
│   │   ├── index.css         # Global styles + glassmorphism
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── start-backend.bat   # One-click backend launcher (Windows)
├── start-frontend.bat  # One-click frontend launcher (Windows)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Windows 10/11 (WASAPI audio capture)
- Python 3.10+
- Node.js 18+

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/auraview-screen-mirror.git
cd auraview-screen-mirror
```

### 2. Setup Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Setup Frontend
```bash
cd frontend
npm install
```

---

## ▶️ Running the App

### Option A: One-click Launch (Windows)
```
Double-click → start-backend.bat
Double-click → start-frontend.bat
```

### Option B: Manual
```bash
# Terminal 1 — Backend
cd backend
venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend
cd frontend
npm run dev -- --host 0.0.0.0
```

### Access on Mobile
1. PC & Mobile must be on the **same Wi-Fi network**
2. Open Mobile browser → `http://<YOUR-PC-IP>:5173`
3. Enter the 4-digit security PIN shown on screen
4. Tap **Start Mirroring** → tap **Enable Audio**

> 💡 Find your PC IP: Run `ipconfig` in Command Prompt → look for `IPv4 Address`

---

## 🔊 PC Audio on Mobile (Mute PC Speakers & Hear Audio on Phone)

To mute your physical PC speakers while still listening to computer audio in real-time on your mobile device:

### Option 1: Direct Loopback Stream (Recommended)
1. Lower your PC physical speaker volume to **0** (or mute physical speakers).
2. In the mobile browser app, tap **"Enable Audio"** or toggle **PC Sound** in Stream Controls.
3. The built-in WASAPI loopback capturer streams PC system audio directly to your mobile browser, so you can hear movies, games, and music privately on your phone!

### Option 2: Using Virtual Audio Cable or Bluetooth
1. Click the **Volume icon** on the Windows Taskbar and select the **`>`** arrow next to the volume slider.
2. Choose **CABLE Input (VB-Audio Virtual Cable)** or your paired **Bluetooth device**.
3. In the mobile app, make sure **PC Sound** is enabled.

> 💡 *Free Virtual Cable driver available at: [https://vb-audio.com/Cable/](https://vb-audio.com/Cable/)*

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/pin-info` | Get active PIN + local IP |
| POST | `/api/refresh-pin` | Generate new 4-digit PIN |
| POST | `/api/verify-pin` | Verify PIN authentication |
| GET | `/api/monitors` | List connected displays |
| GET | `/api/stream` | MJPEG HTTP fallback stream |
| WS | `/ws/stream` | WebSocket video + control |
| WS | `/ws/audio` | WebSocket PCM audio stream |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F` | Toggle Fullscreen |
| Arrow Keys | Remote scroll (when Remote Control is ON) |

---

## 📄 License

MIT License — Free to use, modify, and distribute.

---

Made with ❤️ — **AuraView Screen Mirroring System**
*Powered by FastAPI · MSS · WASAPI Loopback · React · Web Audio API*
