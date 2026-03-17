import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Play, Bell, AlertCircle, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
}

const StockScreener: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevSignalsCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 30000); // Poll every 30 seconds
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
      setTimeout(() => setIsScanning(false), 5000); // Visual feedback
    } catch (err) {
      console.error('Failed to start scan', err);
      setIsScanning(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
      
      <header className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Stock Screener
          </h1>
          <p className="text-slate-400 mt-1">Real-time strategy monitoring</p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-xl border transition-all ${
              soundEnabled ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <Bell size={20} className={soundEnabled ? 'animate-pulse' : ''} />
          </button>
          <button
            onClick={startScan}
            disabled={isScanning}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              isScanning 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
            }`}
          >
            {isScanning ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
            {isScanning ? 'Scanning...' : 'Run Scan'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
          {signals.map((signal) => (
            <motion.div
              key={signal._id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className={`relative overflow-hidden group p-6 rounded-2xl border transition-all ${
                signal.type === 'BUY' 
                  ? 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40' 
                  : 'bg-rose-950/20 border-rose-500/20 hover:border-rose-500/40'
              }`}
            >
              {/* Background Glow */}
              <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-all group-hover:opacity-30 ${
                signal.type === 'BUY' ? 'bg-emerald-500' : 'bg-rose-500'
              }`} />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-medium text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded">
                    {signal.strategy}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2 mb-1">{signal.symbol}</h3>
                  <p className="text-sm text-slate-500">{signal.name}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  signal.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {signal.type === 'BUY' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {signal.type}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-800/50">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Entry</p>
                  <p className="text-sm font-mono text-white">₹{signal.entryPrice.toFixed(2)}</p>
                </div>
                <div className="text-center border-x border-slate-800/50 px-2">
                  <p className="text-[10px] text-rose-500 uppercase font-bold mb-1">Stoploss</p>
                  <p className="text-sm font-mono text-rose-400">₹{signal.stopLoss.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-emerald-500 uppercase font-bold mb-1">Target</p>
                  <p className="text-sm font-mono text-emerald-400">₹{signal.target.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <span className="text-[10px] text-slate-600 font-medium italic">
                  {new Date(signal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                  Trade Now <ArrowRight size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {signals.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="inline-flex py-4 px-4 bg-slate-900 rounded-2xl border border-slate-800 text-slate-600">
              <AlertCircle size={48} />
            </div>
            <p className="text-slate-500 font-medium">No active signals found. Run a scan to find setups.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockScreener;
