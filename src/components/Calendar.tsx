import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isToday, 
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { Zap, Activity, Brain, BookOpen, CheckCircle2, Wind, Eye, AlertCircle, Rocket, Target, AlertTriangle, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';
import { DailyLog, Habit, Emotion } from '../types';

interface CalendarProps {
  currentDate: Date;
  logs: DailyLog[];
  habits: Habit[];
  onSelectDate: (date: Date) => void;
}

const HabitIcon = ({ id, size = 12, className = "" }: { id: string, size?: number, className?: string }) => {
  switch (id) {
    case '1': return <Zap size={size} className={className} />;
    case '2': return <Activity size={size} className={className} />;
    case '3': return <Brain size={size} className={className} />;
    case '4': return <BookOpen size={size} className={className} />;
    default: return <CheckCircle2 size={size} className={className} />;
  }
};

const EmotionIcon = ({ type, size = 10, className = "" }: { type: Emotion, size?: number, className?: string }) => {
  switch (type) {
    case 'Calm': return <Wind size={size} className={className} />;
    case 'FOMO': return <Eye size={size} className={className} />;
    case 'Stressed': return <AlertCircle size={size} className={className} />;
    case 'Motivated': return <Rocket size={size} className={className} />;
    case 'Disciplined': return <Target size={size} className={className} />;
    case 'Anxious': return <AlertTriangle size={size} className={className} />;
    case 'Confident': return <Trophy size={size} className={className} />;
    default: return null;
  }
};

export function Calendar({ currentDate, logs, habits, onSelectDate }: CalendarProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="grid grid-cols-7 border-l border-t border-[#141414]">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="p-2 border-r border-b border-[#141414] text-[10px] uppercase tracking-widest font-bold text-center bg-black/5">
          {day}
        </div>
      ))}
      {calendarDays.map((day, i) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const log = logs.find(l => l.date === dateStr);
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        
        let bgColor = "bg-white";
        if (log) {
          if (log.performance > 0) bgColor = "bg-emerald-100 hover:bg-emerald-200";
          else if (log.performance < 0) bgColor = "bg-rose-100 hover:bg-rose-200";
          else bgColor = "bg-gray-100 hover:bg-gray-200";
        }

        const completedHabits = log 
          ? log.habits
              .filter(h => h.completed)
              .map(h => ({
                ...h,
                definition: habits.find(def => def.id === h.id)
              }))
              .filter(h => h.definition)
          : [];

        const primaryHabit = completedHabits[0];

        return (
          <div key={i} className="relative group">
            <button 
              onClick={() => onSelectDate(day)}
              className={cn(
                "h-24 w-full p-2 border-r border-b border-[#141414] flex flex-col justify-between transition-colors text-left",
                !isCurrentMonth && "opacity-20",
                bgColor,
                isToday(day) && "ring-2 ring-inset ring-[#141414] z-10"
              )}
            >
              <span className="text-[10px] font-bold">{format(day, 'd')}</span>
              {log && (
                <div className="space-y-1">
                  <div className={cn(
                    "text-xs font-serif italic font-bold",
                    log.performance > 0 ? "text-emerald-700" : log.performance < 0 ? "text-rose-700" : "text-gray-600"
                  )}>
                    {log.performance > 0 ? `+${log.performance}` : log.performance}
                  </div>
                  <div className="flex gap-0.5">
                    {log.habits.filter(h => h.completed).map((_, idx) => (
                      <div key={idx} className="w-1 h-1 rounded-full bg-[#141414]" />
                    ))}
                  </div>
                </div>
              )}
            </button>

            {/* Tooltip */}
            {log && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#141414] text-[#E4E3E0] p-4 text-[10px] uppercase tracking-widest leading-relaxed z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-[#E4E3E0]/20 shadow-2xl">
                <div className="flex justify-between items-start border-b border-white/10 pb-2 mb-3">
                  <div>
                    <p className="font-bold opacity-50 mb-1">Performance</p>
                    <p className={cn(
                      "text-sm font-serif italic",
                      log.performance > 0 ? "text-emerald-400" : log.performance < 0 ? "text-rose-400" : ""
                    )}>
                      {log.performance > 0 ? `+${log.performance}` : log.performance} P&L
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold opacity-50 mb-1">Date</p>
                    <p className="opacity-80">{format(day, 'MMM d')}</p>
                  </div>
                </div>
                
                {log.emotions.length > 0 && (
                  <div className="mb-3">
                    <p className="font-bold opacity-50 mb-1">Emotions</p>
                    <div className="flex flex-wrap gap-1">
                      {log.emotions.map((e, idx) => (
                        <span key={idx} className="bg-white/10 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                          <EmotionIcon type={e} />
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {completedHabits.length > 0 && (
                  <div className="space-y-3">
                    {primaryHabit && (
                      <div className="bg-white/5 p-2 border border-white/10">
                        <p className="font-bold opacity-50 mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 size={10} className="text-emerald-400" /> Key Achievement
                        </p>
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1.5 bg-white/10", primaryHabit.definition?.color)}>
                            <HabitIcon id={primaryHabit.id} size={14} />
                          </div>
                          <span className="text-xs font-serif italic normal-case">{primaryHabit.definition?.name}</span>
                        </div>
                      </div>
                    )}
                    
                    {completedHabits.length > 1 && (
                      <div>
                        <p className="font-bold opacity-50 mb-1.5">Other Habits</p>
                        <div className="flex flex-wrap gap-2">
                          {completedHabits.slice(1).map((h, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 opacity-80" title={h.definition?.name}>
                              <HabitIcon id={h.id} size={12} className={h.definition?.color} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#141414]" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
