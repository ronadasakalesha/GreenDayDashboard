import React, { useState } from 'react';
import { format } from 'date-fns';
import { XCircle, CheckCircle2, Zap, ShieldAlert, BookOpen, Target, Coins, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';
import { DailyLog, Habit, Emotion, Playbook, AssetClass } from '../types';

const EMOTIONS: Emotion[] = ['Calm', 'FOMO', 'Stressed', 'Motivated', 'Disciplined', 'Anxious', 'Confident'];

const PlaybookIcon = ({ icon, size = 16, className = "" }: { icon: string, size?: number, className?: string }) => {
  switch (icon) {
    case 'Zap': return <Zap size={size} className={className} />;
    case 'ShieldAlert': return <ShieldAlert size={size} className={className} />;
    case 'BookOpen': return <BookOpen size={size} className={className} />;
    case 'Target': return <Target size={size} className={className} />;
    default: return <BookOpen size={size} className={className} />;
  }
};

interface EntryFormProps {
  date: Date;
  onClose: () => void;
  onSave: (log: DailyLog) => void;
  existingLog?: DailyLog;
  habits: Habit[];
  playbooks: Playbook[];
}

export function EntryForm({ date, onClose, onSave, existingLog, habits, playbooks }: EntryFormProps) {
  const [performance, setPerformance] = useState(existingLog?.performance || 0);
  const [discipline, setDiscipline] = useState(existingLog?.disciplineScore || 80);
  const [notes, setNotes] = useState(existingLog?.notes || '');
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>(existingLog?.emotions || []);
  const [completedHabits, setCompletedHabits] = useState<string[]>(
    existingLog?.habits.filter(h => h.completed).map(h => h.id) || []
  );
  const [selectedPlaybooks, setSelectedPlaybooks] = useState<string[]>(existingLog?.playbookIds || []);
  const [assetClass, setAssetClass] = useState<Exclude<AssetClass, 'All'>>(
    (existingLog?.assetClass as Exclude<AssetClass, 'All'>) || 'Stocks'
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (selectedEmotions.length === 0) {
      setError("Please select at least one emotion to reflect your state.");
      return;
    }

    if (performance < -10 || performance > 10) {
      setError("Performance value must be between -10 and 10.");
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
      habits: habits.map(h => ({
        id: h.id,
        completed: completedHabits.includes(h.id)
      })),
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

  const toggleHabit = (id: string) => {
    setError(null);
    setCompletedHabits(prev => 
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    );
  };

  const togglePlaybook = (id: string) => {
    setError(null);
    setSelectedPlaybooks(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

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
                <input 
                  type="range" min="-10" max="10" step="1" 
                  value={performance} 
                  onChange={(e) => {
                    setError(null);
                    setPerformance(parseInt(e.target.value));
                  }}
                  className="flex-1 accent-[#141414]"
                />
                <span className={cn(
                  "text-2xl font-serif italic w-12 text-center",
                  performance > 0 ? "text-emerald-600" : performance < 0 ? "text-rose-600" : ""
                )}>
                  {performance > 0 ? `+${performance}` : performance}
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
            <label className="text-[10px] uppercase tracking-widest font-bold">Habit Checklist</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {habits.map(habit => (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => toggleHabit(habit.id)}
                  className={cn(
                    "p-4 border border-[#141414] flex flex-col items-center gap-2 transition-colors",
                    completedHabits.includes(habit.id) ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-black/5"
                  )}
                >
                  <CheckCircle2 size={20} className={completedHabits.includes(habit.id) ? "text-emerald-400" : "opacity-20"} />
                  <span className="text-[10px] uppercase tracking-widest font-bold">{habit.name}</span>
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
