import time
import logging
import threading
from collections import deque
import numpy as np

try:
    import soundcard as sc
    HAS_SOUNDCARD = True
except ImportError:
    HAS_SOUNDCARD = False

logger = logging.getLogger("AudioCapturer")

class AudioCapturer:
    def __init__(self, sample_rate: int = 44100, channels: int = 2):
        self.sample_rate = sample_rate
        self.channels = channels
        self.is_running = False
        self._lock = threading.Lock()
        self.buffer_queue = deque(maxlen=8)
        self.worker_thread = None

        if HAS_SOUNDCARD:
            self.start()

    def _get_default_loopback_mic(self):
        """Dynamically finds the WASAPI loopback microphone for active output device."""
        if not HAS_SOUNDCARD:
            return None
        try:
            default_spk = sc.default_speaker()
            if default_spk:
                return sc.get_microphone(id=default_spk.id, include_loopback=True)
        except Exception as e:
            logger.debug(f"Failed getting default speaker loopback by ID: {e}")

        try:
            loopbacks = [m for m in sc.all_microphones(include_loopback=True) if m.isloopback]
            if loopbacks:
                return loopbacks[0]
        except Exception as e:
            logger.error(f"Error enumerating fallback loopbacks: {e}")

        return None

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.worker_thread = threading.Thread(target=self._record_loop, daemon=True)
        self.worker_thread.start()
        logger.info("Dynamic desktop audio capture thread started.")

    def stop(self):
        self.is_running = False

    def _record_loop(self):
        """Continuously captures system audio from active output into ring buffer safely."""
        chunk_frames = 1024

        while self.is_running:
            try:
                mic = self._get_default_loopback_mic()
                if not mic:
                    time.sleep(2.0)
                    continue

                logger.info(f"Capturing PC sound from active output loopback: {mic.name}")
                with mic.recorder(samplerate=self.sample_rate) as recorder:
                    while self.is_running:
                        data_float = recorder.record(numframes=chunk_frames)
                        
                        if data_float.ndim == 1:
                            data_float = np.column_stack((data_float, data_float))
                        elif data_float.shape[1] == 1:
                            data_float = np.repeat(data_float, 2, axis=1)
                        elif data_float.shape[1] > 2:
                            data_float = data_float[:, :2]

                        data_int16 = (np.clip(data_float, -1.0, 1.0) * 32767).astype(np.int16)
                        raw_bytes = data_int16.tobytes()

                        with self._lock:
                            self.buffer_queue.append(raw_bytes)
            except Exception as e:
                logger.warning(f"Audio capture stream error or output device changed ({e}). Retrying...")
                time.sleep(1.0)

    def capture_pcm_chunk(self) -> bytes:
        """Pops accumulated PCM bytes from ring buffer, dropping stale chunks for zero latency."""
        with self._lock:
            if not self.buffer_queue:
                return b''
            while len(self.buffer_queue) > 2:
                self.buffer_queue.popleft()
            chunks = []
            while self.buffer_queue:
                chunks.append(self.buffer_queue.popleft())
            return b''.join(chunks)

# Global audio capturer instance
audio_capturer = AudioCapturer()
