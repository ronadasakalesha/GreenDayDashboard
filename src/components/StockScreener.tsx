import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Play, Bell, AlertCircle, TrendingUp, TrendingDown, ArrowRight, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface Signal {
  _id: string;
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  target: number;
  time: string;
  strategy: string;
  nnScore: number;
  grade: string;
}

const StockScreener: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevSignalsCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 30000); 
    return () => clearInterval(interval);
  }, []);

  const fetchSignals = async () => {
    try {
      const data = await api.getSignals();
      if (data.length > prevSignalsCount.current && prevSignalsCount.current !== 0 && soundEnabled) {
        audioRef.current?.play();
      }
      setSignals(data);
      prevSignalsCount.current = data.length;
    } catch (err) {
      console.error('Failed to fetch signals', err);
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    try {
      await api.triggerScan();
      setTimeout(() => setIsScanning(false), 5000); 
    } catch (err) {
      console.error('Failed to start scan', err);
      setIsScanning(false);
    }
  };

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-12">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#141414] pb-10">
        <div>
          <h1 className="text-4xl font-serif italic tracking-tighter text-[#141414]">
            Stock Screener
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#141414]/50 mt-2">
            Real-time Confluence Intelligence
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "p-4 border border-[#141414] transition-colors",
              soundEnabled ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/5"
            )}
          >
            <Bell size={18} className={soundEnabled ? 'animate-pulse' : ''} />
          </button>
          <button
            type="button"
            onClick={startScan}
            disabled={isScanning}
            className="group flex items-center gap-3 px-8 py-4 bg-[#141414] text-[#E4E3E0] text-[10px] uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isScanning ? (
              <div className="w-4 h-4 border-2 border-[#E4E3E0]/30 border-t-[#E4E3E0] rounded-full animate-spin" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
            {isScanning ? 'SCANNING' : 'RUN ENGINE'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode='popLayout'>
          {signals.map((signal) => (
            <motion.div
              key={signal._id}
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="border border-[#141414] bg-white flex flex-col group"
            >
              {/* Card Header with Grade */}
              <div className="p-6 border-b border-[#141414] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 flex items-center justify-center font-serif italic text-lg border border-[#141414]",
                    signal.grade === 'A+' ? "bg-[#141414] text-[#E4E3E0]" : "bg-white"
                  )}>
                    {signal.grade}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tighter">{signal.symbol}</h3>
                    <p className="text-[9px] uppercase tracking-widest opacity-40">{signal.name}</p>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 border border-[#141414] text-[9px] font-bold uppercase tracking-widest",
                  signal.type === 'BUY' ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"
                )}>
                  {signal.type}
                </div>
              </div>

              {/* Strategy & Time */}
              <div className="px-6 py-4 bg-[#141414]/[0.02] flex justify-between items-center border-b border-[#141414]/10">
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest opacity-60">
                  <BrainCircuit size={12} />
                  {signal.strategy}
                </div>
                <span className="text-[9px] font-mono opacity-40">
                  {new Date(signal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              {/* Levels Grid */}
              <div className="grid grid-cols-3 divide-x divide-[#141414]/10">
                <div className="p-5 text-center">
                  <p className="text-[8px] uppercase tracking-widest opacity-40 mb-2">Entry</p>
                  <p className="text-sm font-bold">₹{signal.entryPrice.toLocaleString()}</p>
                </div>
                <div className="p-5 text-center">
                  <p className="text-[8px] uppercase tracking-widest opacity-40 mb-2">Stop</p>
                  <p className="text-sm font-bold text-rose-600">₹{signal.stopLoss.toLocaleString()}</p>
                </div>
                <div className="p-5 text-center">
                  <p className="text-[8px] uppercase tracking-widest opacity-40 mb-2">Target</p>
                  <p className="text-sm font-bold text-emerald-600">₹{signal.target.toLocaleString()}</p>
                </div>
              </div>

              {/* Footer with Confidence */}
              <div className="mt-auto border-t border-[#141414] p-6 flex justify-between items-center bg-[#141414] text-[#E4E3E0]">
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase tracking-widest opacity-50 mb-0.5">Neural Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${signal.nnScore * 100}%` }}
                        className="h-full bg-white transition-all"
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold">{(signal.nnScore * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:translate-x-1 transition-transform">
                  TRADE <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {signals.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 border border-[#141414] border-dashed opacity-30">
            <AlertCircle size={32} strokeWidth={1} />
            <p className="text-[10px] uppercase tracking-[0.3em] font-medium">Screener engine offline</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockScreener;
