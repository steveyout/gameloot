import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Smartphone, Monitor, RefreshCw, Zap, Award, CheckCircle2, 
  Clock, ShieldAlert, Sparkles, ExternalLink, Play
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function GameSimulatorModal({ game, onClose }) {
  const [orientation, setOrientation] = useState(game?.orientation === 'landscape' ? 'landscape' : 'portrait');
  const [secondsPlayed, setSecondsPlayed] = useState(0);
  const [simulatedPoints, setSimulatedPoints] = useState(0);
  const [lastHeartbeatSec, setLastHeartbeatSec] = useState(0);
  const [claimed, setClaimed] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());

  const rewardRate = game?.reward_rate || 15; // points per minute

  // Play session timer
  useEffect(() => {
    if (claimed) return;
    const interval = setInterval(() => {
      setSecondsPlayed((prev) => {
        const next = prev + 1;
        // Points earned based on rate per minute
        const calculated = Math.floor((next / 60) * rewardRate);
        setSimulatedPoints(calculated);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rewardRate, claimed]);

  // Heartbeat ping tracker every 15s
  useEffect(() => {
    if (claimed) return;
    const hb = setInterval(() => {
      setLastHeartbeatSec(Date.now());
    }, 15000);
    return () => clearInterval(hb);
  }, [claimed]);

  const handleClaim = () => {
    setClaimed(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleReload = () => {
    setIframeKey(Date.now());
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  if (!game) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative flex flex-col bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 max-w-5xl w-full max-h-[92vh] overflow-hidden"
        >
          {/* Top Bar / Controls */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/80 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 m-0">
                  <span>{game.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800/80 text-cyan-400 font-mono">
                    Live Game Embed Simulator
                  </span>
                </h3>
                <p className="text-xs text-slate-400 m-0 truncate max-w-md">
                  {game.embed_url}
                </p>
              </div>
            </div>

            {/* Mode & Action Controls */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                    orientation === 'portrait' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mobile Portrait (9:16)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Portrait</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                    orientation === 'landscape' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mobile Landscape (16:9)"
                >
                  <Smartphone className="w-3.5 h-3.5 rotate-90" />
                  <span>Landscape</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('responsive')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                    orientation === 'responsive' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Desktop/Full View"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Full</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleReload}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Reload Game Frame"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <a
                href={game.embed_url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Open directly in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors ml-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Play-to-Earn Simulator HUD */}
          <div className="px-6 py-2.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400">Play Time:</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">
                  {formatTime(secondsPlayed)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-slate-400">Rate:</span>
                <span className="font-mono font-bold text-amber-300">
                  {rewardRate} pts / min
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">Accrued Loot:</span>
                <motion.span 
                  key={simulatedPoints}
                  initial={{ scale: 1.2, color: '#34d399' }}
                  animate={{ scale: 1, color: '#10b981' }}
                  className="font-mono font-bold text-sm"
                >
                  +{simulatedPoints} Points
                </motion.span>
              </div>

              <div className="hidden md:flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Anti-Cheat Proof-of-Play Heartbeat Synced</span>
              </div>
            </div>

            <div>
              {claimed ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Claimed! (+{simulatedPoints} PTS)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleClaim}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulate Claim Reward</span>
                </button>
              )}
            </div>
          </div>

          {/* Device Mockup & Iframe Container */}
          <div className="flex-1 bg-[#05070d] p-4 flex items-center justify-center overflow-auto min-h-[500px]">
            <div
              className={`relative transition-all duration-300 flex flex-col items-center justify-center shadow-2xl ${
                orientation === 'portrait'
                  ? 'w-[375px] h-[640px] rounded-[36px] p-3 bg-slate-800 border-4 border-slate-700 ring-8 ring-slate-900/60'
                  : orientation === 'landscape'
                  ? 'w-[680px] h-[390px] rounded-[36px] p-3 bg-slate-800 border-4 border-slate-700 ring-8 ring-slate-900/60'
                  : 'w-full h-[560px] rounded-xl bg-slate-900 border border-slate-800'
              }`}
            >
              {/* Phone Speaker & Camera Notch (mobile view only) */}
              {orientation !== 'responsive' && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700" />
                </div>
              )}

              {/* Game Iframe */}
              <div className="w-full h-full rounded-[24px] overflow-hidden bg-black relative">
                <iframe
                  key={iframeKey}
                  src={game.embed_url}
                  title={game.title}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; gamepad"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </div>

              {/* Home indicator bar (mobile view only) */}
              {orientation !== 'responsive' && (
                <div className="w-24 h-1 bg-slate-600 rounded-full mt-1.5 opacity-60" />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
