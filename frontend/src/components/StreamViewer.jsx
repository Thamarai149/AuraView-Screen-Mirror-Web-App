import React, { useRef, useEffect, useState } from 'react';
import { Maximize, Minimize, Camera, Play, AlertCircle, RefreshCw, Eye, MousePointer, ShieldOff, ShieldAlert, RotateCw, Smartphone, Ratio } from 'lucide-react';

export default function StreamViewer({ 
  currentFrameBlob, 
  isStreaming, 
  isConnected, 
  resolution, 
  fps,
  rotation = 0,
  onRotate,
  fitMode = 'contain',
  onChangeFitMode,
  isRemoteControlActive,
  isPrivacyModeActive,
  onTogglePrivacyMode,
  onStartStream,
  onReconnect,
  onInputEvent
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [frameDimensions, setFrameDimensions] = useState({ width: 1280, height: 720 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Render incoming binary JPEG Blob to HTML5 Canvas
  useEffect(() => {
    if (!currentFrameBlob || !isStreaming || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const url = URL.createObjectURL(currentFrameBlob);
    const img = new Image();

    img.onload = () => {
      if (canvas.width !== img.width || canvas.height !== img.height) {
        canvas.width = img.width;
        canvas.height = img.height;
        setFrameDimensions({ width: img.width, height: img.height });
      }
      ctx.drawImage(img, 0, 0);
      setImageLoaded(true);
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
    };

    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [currentFrameBlob, isStreaming]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcut 'F' for fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error("Error entering fullscreen:", err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error("Error exiting fullscreen:", err);
      });
    }
  };

  const takeSnapshot = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `screen-capture-${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  // Helper to calculate normalized (0.0 to 1.0) coordinates with rotation transposition
  const getCanvasCoords = (e) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    let x = (clientX - rect.left) / rect.width;
    let y = (clientY - rect.top) / rect.height;

    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    let orig_x = x;
    let orig_y = y;

    if (rotation === 90) {
      orig_x = 1.0 - y;
      orig_y = x;
    } else if (rotation === 180) {
      orig_x = 1.0 - x;
      orig_y = 1.0 - y;
    } else if (rotation === 270) {
      orig_x = y;
      orig_y = 1.0 - x;
    }

    return {
      x_ratio: Math.max(0, Math.min(1, orig_x)),
      y_ratio: Math.max(0, Math.min(1, orig_y))
    };
  };

  // Remote Control Keyboard Event Handler
  useEffect(() => {
    if (!isRemoteControlActive) return;

    const handleRemoteKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'f' || e.key === 'F') return; // Allow F key for fullscreen toggle

      if (onInputEvent) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Backspace', 'Enter'].includes(e.key)) {
          e.preventDefault();
        }
        onInputEvent({
          type: 'press',
          key: e.key
        });
      }
    };

    window.addEventListener('keydown', handleRemoteKeyDown);
    return () => window.removeEventListener('keydown', handleRemoteKeyDown);
  }, [isRemoteControlActive, onInputEvent]);

  // Canvas Remote Touch / Mouse Input Event Handlers
  const handleCanvasClick = (e) => {
    if (!isRemoteControlActive || !onInputEvent) return;
    const coords = getCanvasCoords(e);
    if (coords) {
      onInputEvent({
        type: 'click',
        button: e.button === 2 ? 'right' : 'left',
        ...coords
      });
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (!isRemoteControlActive || !onInputEvent) return;
    const coords = getCanvasCoords(e);
    if (coords) {
      onInputEvent({
        type: 'mousedown',
        button: e.button === 2 ? 'right' : 'left',
        ...coords
      });
    }
  };

  const handleCanvasMouseUp = (e) => {
    if (!isRemoteControlActive || !onInputEvent) return;
    const coords = getCanvasCoords(e);
    if (coords) {
      onInputEvent({
        type: 'mouseup',
        button: e.button === 2 ? 'right' : 'left',
        ...coords
      });
    }
  };

  const handleCanvasDoubleClick = (e) => {
    if (!isRemoteControlActive || !onInputEvent) return;
    const coords = getCanvasCoords(e);
    if (coords) {
      onInputEvent({
        type: 'double_click',
        ...coords
      });
    }
  };

  const handleCanvasContextMenu = (e) => {
    if (!isRemoteControlActive) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (coords && onInputEvent) {
      onInputEvent({
        type: 'right_click',
        ...coords
      });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isRemoteControlActive || !onInputEvent) return;
    const coords = getCanvasCoords(e);
    if (coords) {
      onInputEvent({
        type: 'move',
        ...coords
      });
    }
  };

  const handleCanvasWheel = (e) => {
    if (!isRemoteControlActive || !onInputEvent) return;
    const coords = getCanvasCoords(e);
    if (coords) {
      onInputEvent({
        type: 'scroll',
        delta_y: e.deltaY < 0 ? 100 : -100,
        ...coords
      });
    }
  };

  // Dynamic canvas CSS fitting based on fitMode
  const [isExpandedView, setIsExpandedView] = useState(false);

  const isRotatedVertical = rotation === 90 || rotation === 270;
  const normalAspect = (frameDimensions.width && frameDimensions.height) 
    ? (frameDimensions.width / frameDimensions.height) 
    : (16 / 9);
  const rotatedAspect = isRotatedVertical ? (1 / normalAspect) : normalAspect;

  const getFitModeClass = () => {
    switch (fitMode) {
      case 'best_fit':
        return 'object-contain max-w-full max-h-full mx-auto shadow-2xl';
      case 'fit_screen':
        return 'w-full h-full object-contain';
      case 'fill':
        return 'object-cover w-full h-full';
      case '16:9':
        return 'aspect-video object-contain w-full h-full';
      case '4:3':
        return 'aspect-[4/3] object-contain w-full h-full';
      case 'center':
        return 'object-none m-auto max-w-none max-h-none';
      case 'notch':
        return 'object-contain max-w-full max-h-full notch-container rounded-3xl border-2 border-cyan-500/40 shadow-2xl';
      default:
        return 'object-contain max-w-full max-h-full mx-auto';
    }
  };

  const cycleFitMode = () => {
    if (!onChangeFitMode) return;
    const modes = ['best_fit', 'fit_screen', 'fill', '16:9', '4:3', 'center', 'notch'];
    const nextIdx = (modes.indexOf(fitMode) + 1) % modes.length;
    onChangeFitMode(modes[nextIdx]);
  };

  return (
    <div 
      ref={containerRef}
      style={!(isFullscreen || isExpandedView) ? { aspectRatio: `${rotatedAspect}` } : {}}
      className={`relative group glass-panel rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex items-center justify-center ${
        isFullscreen || isExpandedView 
          ? 'fixed inset-0 z-50 w-screen h-screen bg-black rounded-none border-none' 
          : 'w-full max-h-[85vh] bg-slate-950/90 mx-auto'
      } ${fitMode === 'notch' ? 'notch-container' : ''}`}
    >
      {/* Canvas rendering area */}
      <canvas 
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleCanvasMouseUp}
        onDoubleClick={handleCanvasDoubleClick}
        onContextMenu={handleCanvasContextMenu}
        onMouseMove={handleCanvasMouseMove}
        onWheel={handleCanvasWheel}
        onTouchStart={handleCanvasClick}
        style={{
          transform: isRotatedVertical 
            ? `rotate(${rotation}deg) scale(${normalAspect})` 
            : rotation 
            ? `rotate(${rotation}deg)` 
            : 'none',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        className={`${getFitModeClass()} ${
          isStreaming && imageLoaded ? 'block' : 'hidden'
        } ${isRemoteControlActive ? 'cursor-crosshair' : 'cursor-default'}`}
      />

      {/* Live Stream Controls Overlay (Top Badges & Actions) */}
      {isStreaming && imageLoaded && (
        <>
          {/* Top telemetry badges */}
          <div className="absolute top-4 left-4 flex items-center space-x-2 z-20 transition-opacity duration-200 group-hover:opacity-100 opacity-80">
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs font-mono text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{resolution.toUpperCase()}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">{frameDimensions.width}x{frameDimensions.height}</span>
              {rotation > 0 && <span className="text-amber-400 font-bold ml-1">{rotation}°</span>}
              {fitMode !== 'contain' && <span className="text-cyan-300 font-bold ml-1 uppercase">{fitMode}</span>}
            </span>

            {isRemoteControlActive && (
              <span className="flex items-center space-x-1 px-3 py-1 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-500/40 text-xs font-semibold text-cyan-300 animate-pulse">
                <MousePointer className="w-3 h-3" />
                <span className="hidden sm:inline">REMOTE CONTROL</span>
              </span>
            )}

            {isPrivacyModeActive && (
              <span className="flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-xs font-semibold text-amber-300">
                <ShieldAlert className="w-3 h-3" />
                <span className="hidden sm:inline">PRIVACY FROZEN</span>
              </span>
            )}
          </div>

          {/* Top Right Quick Actions */}
          <div className="absolute top-4 right-4 flex items-center space-x-2 z-20 transition-opacity duration-200 group-hover:opacity-100 opacity-70 hover:opacity-100">
            {/* Mobile Expanded View Toggle */}
            <button
              onClick={() => setIsExpandedView(prev => !prev)}
              title={isExpandedView ? "Exit Expanded View" : "Full Screen View (Mobile Fit)"}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-600/80 text-cyan-400 hover:text-white backdrop-blur-md border border-slate-700/60 transition-all duration-200 shadow-lg cursor-pointer flex items-center space-x-1"
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-[10px] font-bold font-mono">{isExpandedView ? "EXIT" : "FULL"}</span>
            </button>

            {/* Quick Rotate Button */}
            <button
              onClick={onRotate}
              title={`Rotate Screen (Current: ${rotation}°)`}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-600/80 text-slate-200 hover:text-white backdrop-blur-md border border-slate-700/60 transition-all duration-200 shadow-lg cursor-pointer flex items-center space-x-1"
            >
              <RotateCw className="w-4 h-4 text-amber-400" />
              {rotation > 0 && <span className="text-[10px] font-bold text-amber-400 font-mono">{rotation}°</span>}
            </button>

            {/* Quick Aspect Ratio / Fit Mode Button */}
            <button
              onClick={cycleFitMode}
              title={`Aspect Ratio Mode: ${fitMode.toUpperCase()}`}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-600/80 text-slate-200 hover:text-white backdrop-blur-md border border-slate-700/60 transition-all duration-200 shadow-lg cursor-pointer flex items-center space-x-1"
            >
              <Ratio className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-bold text-cyan-300 uppercase font-mono">{fitMode}</span>
            </button>

            <button
              onClick={onTogglePrivacyMode}
              title={isPrivacyModeActive ? "Disable Privacy Freeze" : "Enable Privacy Freeze (Hide Screen)"}
              className={`p-2.5 rounded-xl backdrop-blur-md border transition-all duration-200 shadow-lg cursor-pointer ${
                isPrivacyModeActive 
                  ? 'bg-amber-500/80 hover:bg-amber-600 text-slate-950 border-amber-400 font-bold'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
              }`}
            >
              <ShieldOff className="w-4 h-4" />
            </button>

            <button
              onClick={takeSnapshot}
              title="Download Snapshot (JPG)"
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-600/80 text-slate-200 hover:text-white backdrop-blur-md border border-slate-700/60 transition-all duration-200 shadow-lg cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-600/80 text-slate-200 hover:text-white backdrop-blur-md border border-slate-700/60 transition-all duration-200 shadow-lg cursor-pointer"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </>
      )}


      {/* Overlay: Not Streaming / Standby State */}
      {!isStreaming && isConnected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm text-center p-6 z-10">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Eye className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Screen Stream Standby</h3>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            Backend is connected and ready. Click start stream below to broadcast your desktop screen in real-time.
          </p>
          <button
            onClick={onStartStream}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Mirroring</span>
          </button>
        </div>
      )}

      {/* Overlay: Disconnected / Error State */}
      {!isConnected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md text-center p-6 z-10">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Backend Connection Disconnected</h3>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            Unable to connect to screen streaming service at <code className="text-rose-300 bg-slate-900 px-2 py-0.5 rounded">ws://localhost:8000/ws/stream</code>.
          </p>
          <button
            onClick={onReconnect}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-all duration-200 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Reconnecting</span>
          </button>
        </div>
      )}

      {/* Overlay: Loading Frame indicator */}
      {isStreaming && !imageLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm z-10">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-cyan-300 font-medium tracking-wide">INITIALIZING STREAM FEED...</p>
        </div>
      )}
    </div>
  );
}
