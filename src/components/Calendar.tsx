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
import { Wind, Eye, AlertCircle, Rocket, Target, AlertTriangle, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';
import { DailyLog, Emotion } from '../types';

interface CalendarProps {
  currentDate: Date;
  logs: DailyLog[];
  onSelectDate: (date: Date) => void;
}

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

export function Calendar({ currentDate, logs, onSelectDate }: CalendarProps) {
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
        
        const currencySymbol = log?.assetClass === 'Stocks' ? '₹' : '$';
        
        let bgColor = "bg-white";
        if (log) {
          if (log.performance > 0) bgColor = "bg-emerald-100 hover:bg-emerald-200";
          else if (log.performance < 0) bgColor = "bg-rose-100 hover:bg-rose-200";
          else bgColor = "bg-gray-100 hover:bg-gray-200";
        }

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
                    "text-[10px] font-serif italic font-bold",
                    log.performance > 0 ? "text-emerald-700" : log.performance < 0 ? "text-rose-700" : "text-gray-600"
                  )}>
                    {log.performance > 0 ? `+${currencySymbol}${log.performance.toLocaleString()}` : log.performance < 0 ? `-${currencySymbol}${Math.abs(log.performance).toLocaleString()}` : `${currencySymbol}0`}
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
                      {log.performance > 0 ? `+${currencySymbol}${log.performance.toLocaleString()}` : log.performance < 0 ? `-${currencySymbol}${Math.abs(log.performance).toLocaleString()}` : `${currencySymbol}0`} P&L
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
