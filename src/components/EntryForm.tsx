import React, { useState } from 'react';
import { format } from 'date-fns';
import { XCircle, Zap, ShieldAlert, BookOpen, Target, Activity, Coins, Briefcase, Download, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { DailyLog, Emotion, Playbook, AssetClass } from '../types';

const EMOTIONS: Emotion[] = ['Calm', 'FOMO', 'Stressed', 'Motivated', 'Disciplined', 'Anxious', 'Confident'];

const PlaybookIcon = ({ icon, size = 16, className = "" }: { icon: string, size?: number, className?: string }) => {
  switch (icon) {
    case 'Zap': return <Zap size={size} className={className} />;
    case 'ShieldAlert': return <ShieldAlert size={size} className={className} />;
    case 'BookOpen': return <BookOpen size={size} className={className} />;
    case 'Target': return <Target size={size} className={className} />;
    case 'Activity': return <Activity size={size} className={className} />;
    default: return <BookOpen size={size} className={className} />;
  }
};

interface EntryFormProps {
  date: Date;
  onClose: () => void;
  onSave: (log: DailyLog) => void;
  existingLog?: DailyLog;
  playbooks: Playbook[];
}

export function EntryForm({ date, onClose, onSave, existingLog, playbooks }: EntryFormProps) {
  const [performance, setPerformance] = useState(existingLog?.performance || 0);
  const [discipline, setDiscipline] = useState(existingLog?.disciplineScore || 80);
  const [notes, setNotes] = useState(existingLog?.notes || '');
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>(existingLog?.emotions || []);
  const [selectedPlaybooks, setSelectedPlaybooks] = useState<string[]>(existingLog?.playbookIds || []);
  const [assetClass, setAssetClass] = useState<Exclude<AssetClass, 'All'>>(
    (existingLog?.assetClass as Exclude<AssetClass, 'All'>) || 'Stocks'
  );
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedEmotions.length === 0) {
      setError("Please select at least one emotion to reflect your state.");
      return;
    }

    setError(null);
    onSave({
      id: existingLog?.id || Math.random().toString(36).substr(2, 9),
      date: format(date, 'yyyy-MM-dd'),
      performance,
      disciplineScore: discipline,
      notes,
      emotions: selectedEmotions,
      playbookIds: selectedPlaybooks,
      assetClass
    });
  };

  const toggleEmotion = (emotion: Emotion) => {
    setError(null);
    setSelectedEmotions(prev => 
      prev.includes(emotion) ? prev.filter(e => e !== emotion) : [...prev, emotion]
    );
  };

  const togglePlaybook = (id: string) => {
    setError(null);
    setSelectedPlaybooks(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const fetchExchangePnL = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/logs/fetch-pl?date=${format(date, 'yyyy-MM-dd')}&assetClass=${assetClass}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setPerformance(data.performance);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch P&L');
    } finally {
      setIsFetching(false);
    }
  };

  const currencySymbol = assetClass === 'Stocks' ? '₹' : '$';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#E4E3E0] border border-[#141414] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#141414] flex justify-between items-center bg-[#141414] text-[#E4E3E0]">
          <div>
            <h3 className="text-xl font-serif italic">Daily Performance Log</h3>
            <p className="text-[10px] uppercase tracking-widest opacity-60">{format(date, 'EEEE, MMMM do, yyyy')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10"><XCircle size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-widest font-bold">Asset Class</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setAssetClass('Stocks')}
                className={cn(
                  "flex-1 p-4 border border-[#141414] flex items-center justify-center gap-3 transition-colors",
                  assetClass === 'Stocks' ? "bg-[#141414] text-[#E4E3E0]" : "bg-white hover:bg-black/5"
                )}
              >
                <Briefcase size={18} />
                <span className="text-[10px] uppercase tracking-widest font-bold">Stocks</span>
              </button>
              <button
                type="button"
                onClick={() => setAssetClass('Crypto')}
                className={cn(
                  "flex-1 p-4 border border-[#141414] flex items-center justify-center gap-3 transition-colors",
                  assetClass === 'Crypto' ? "bg-[#141414] text-[#E4E3E0]" : "bg-white hover:bg-black/5"
                )}
              >
                <Coins size={18} />
                <span className="text-[10px] uppercase tracking-widest font-bold">Crypto</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest font-bold">Performance (P&L)</label>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-50">{currencySymbol}</span>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={performance === 0 ? '' : performance} 
                    onChange={(e) => {
                      setError(null);
                      const val = parseFloat(e.target.value);
                      setPerformance(isNaN(val) ? 0 : val);
                    }}
                    className="w-full bg-white border border-[#141414] pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#141414]"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchExchangePnL}
                  disabled={isFetching}
                  className="px-4 py-3 border border-[#141414] bg-white hover:bg-black/5 flex items-center gap-2 transition-colors disabled:opacity-50"
                  title="Fetch P&L from Exchange"
                >
                  {isFetching ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  <span className="text-[10px] uppercase font-bold tracking-tight">Fetch</span>
                </button>
                <span className={cn(
                  "text-xl font-serif italic min-w-[60px] text-right",
                  performance > 0 ? "text-emerald-600" : performance < 0 ? "text-rose-600" : ""
                )}>
                  {performance > 0 ? `+${currencySymbol}${performance.toLocaleString()}` : performance < 0 ? `-${currencySymbol}${Math.abs(performance).toLocaleString()}` : `${currencySymbol}0`}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest font-bold">Discipline Score</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" min="0" max="100" step="5" 
                  value={discipline} 
                  onChange={(e) => {
                    setError(null);
                    setDiscipline(parseInt(e.target.value));
                  }}
                  className="flex-1 accent-[#141414]"
                />
                <span className="text-2xl font-serif italic w-12 text-center">{discipline}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-widest font-bold">Emotional State</label>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map(emotion => (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => toggleEmotion(emotion)}
                  className={cn(
                    "px-4 py-2 text-[10px] uppercase tracking-widest border border-[#141414] transition-colors",
                    selectedEmotions.includes(emotion) ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-black/5"
                  )}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-widest font-bold">Strategy Playbooks</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playbooks.map(playbook => (
                <button
                  key={playbook.id}
                  type="button"
                  onClick={() => togglePlaybook(playbook.id)}
                  className={cn(
                    "p-4 border border-[#141414] flex items-center gap-4 transition-colors text-left",
                    selectedPlaybooks.includes(playbook.id) ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-black/5 bg-white"
                  )}
                >
                  <div className={cn("p-2 bg-black/5", selectedPlaybooks.includes(playbook.id) && "bg-white/10")}>
                    <PlaybookIcon icon={playbook.icon} className={playbook.color} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold">{playbook.title}</p>
                    <p className="text-[8px] opacity-60 normal-case mt-0.5">{playbook.rules[0]}...</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-widest font-bold">Notes & Reflection</label>
            <textarea 
              value={notes}
              onChange={(e) => {
                setError(null);
                setNotes(e.target.value);
              }}
              placeholder="What did you learn today? Any mistakes to avoid?"
              className="w-full h-32 p-4 bg-white border border-[#141414] text-sm focus:outline-none focus:ring-1 focus:ring-[#141414] resize-none"
            />
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
              <XCircle size={14} />
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button type="submit" className="flex-1 py-4 bg-[#141414] text-[#E4E3E0] uppercase text-xs tracking-widest font-bold hover:opacity-90">Save Entry</button>
            <button type="button" onClick={onClose} className="px-8 py-4 border border-[#141414] uppercase text-xs tracking-widest font-bold hover:bg-black/5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
