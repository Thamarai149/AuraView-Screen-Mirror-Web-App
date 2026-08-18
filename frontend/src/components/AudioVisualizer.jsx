import React, { useEffect, useRef, useState } from 'react';

/**
 * AudioVisualizer — renders animated bars driven by the Web Audio API AnalyserNode.
 * When `audioCtxRef` is null / audio off, shows static idle bars.
 */
export default function AudioVisualizer({ isAudioEnabled, audioCtxRef, sourceNodeRef }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const analyserRef = useRef(null);

  // Build analyser + connect when audio turns on
  useEffect(() => {
    if (!isAudioEnabled || !audioCtxRef?.current) {
      cancelAnimationFrame(animFrameRef.current);
      analyserRef.current = null;
      return;
    }

    const ctx = audioCtxRef.current;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.75;

    // Try to tap into the destination — connect analyser in parallel
    try {
      // We connect a silent gain node after the destination as a monitoring tap
      if (sourceNodeRef?.current) {
        sourceNodeRef.current.connect(analyser);
      }
    } catch (_) {}

    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      const ctx2d = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      ctx2d.clearRect(0, 0, W, H);

      const barCount = 28;
      const gap = 2;
      const barW = (W - gap * (barCount - 1)) / barCount;

      for (let i = 0; i < barCount; i++) {
        const dataIdx = Math.floor((i / barCount) * bufferLength);
        const val = dataArray[dataIdx] / 255;
        const barH = Math.max(2, val * H);

        const gradient = ctx2d.createLinearGradient(0, H - barH, 0, H);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.9)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0.9)');

        ctx2d.fillStyle = gradient;
        ctx2d.beginPath();
        ctx2d.roundRect(i * (barW + gap), H - barH, barW, barH, 2);
        ctx2d.fill();
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      try { analyser.disconnect(); } catch (_) {}
    };
  }, [isAudioEnabled, audioCtxRef, sourceNodeRef]);

  // Idle/static bars when audio is off
  const idleBars = Array.from({ length: 28 }, (_, i) => {
    const heights = [15, 25, 18, 35, 12, 28, 22, 40, 16, 30, 20, 14, 38, 24, 10, 32, 26, 18, 36, 12, 28, 22, 16, 30, 20, 24, 14, 18];
    return heights[i % heights.length];
  });

  return (
    <div className="flex items-center gap-2 w-full">
      {isAudioEnabled ? (
        <canvas
          ref={canvasRef}
          width={280}
          height={32}
          className="w-full h-8 rounded-lg"
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        /* CSS-animated idle bars (no canvas needed) */
        <div className="flex items-end gap-0.5 w-full h-8 px-1">
          {idleBars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm opacity-20"
              style={{
                height: `${h}%`,
                background: 'linear-gradient(to top, rgba(6,182,212,0.6), rgba(99,102,241,0.6))'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
