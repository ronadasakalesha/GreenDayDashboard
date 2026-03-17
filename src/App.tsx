import React, { useState, useEffect, useMemo, ErrorInfo, ReactNode } from 'react';
import { 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Activity, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  BarChart3,
  Brain,
  Zap,
  Download,
  BookOpen,
  Target,
  ShieldAlert,
  LogOut,
  LogIn
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
} from 'date-fns';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Brush
} from 'recharts';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DailyLog, Emotion, Playbook, AssetClass } from './types';
import { cn } from './lib/utils';
import { StatCard } from './components/StatCard';
import { NavItem } from './components/NavItem';
import { Calendar } from './components/Calendar';
import { EntryForm } from './components/EntryForm';
import { exportToCSV } from './lib/export';
import { Coins, Briefcase, Layers } from 'lucide-react';
import { api, AuthUser, getToken, setToken, clearToken } from './api';

const EMOTIONS: Emotion[] = ['Calm', 'FOMO', 'Stressed', 'Motivated', 'Disciplined', 'Anxious', 'Confident'];


const INITIAL_PLAYBOOKS: Playbook[] = [
  { 
    id: 'p1', 
    title: "Day Start strategy", 
    icon: 'Zap',
    color: 'text-blue-500',
    rules: ["Review daily bias", "Mark HOD/LOD of previous day", "Check economic calendar"]
  },
  { 
    id: 'p2', 
    title: "Risk Management", 
    icon: 'ShieldAlert',
    color: 'text-rose-500',
    rules: ["Stop work after 3 failed tasks", "Maximum 10 hours work per day", "Weekly review every Sunday"]
  },
  { 
    id: 'p3', 
    title: "Learning Strategy", 
    icon: 'BookOpen',
    color: 'text-orange-500',
    rules: ["Read 20 pages daily", "Take notes on key insights", "Apply one new concept per week"]
  },
  { 
    id: 'p4', 
    title: "Focus & Flow", 
    icon: 'Target',
    color: 'text-emerald-500',
    rules: ["Phone in another room", "Single-tasking only", "90-minute focus sprints"]
  },
  { 
    id: 'p5', 
    title: "Blue Signals", 
    icon: 'Activity',
    color: 'text-blue-600',
    rules: ["Wait for Blue Anchor signal", "Confirm with volume delta", "Entry on 5m pull-back"]
  },
  { 
    id: 'p6', 
    title: "BlueSync Strategy", 
    icon: 'Zap',
    color: 'text-blue-400',
    rules: ["Sync with higher timeframe trend", "Enter on momentum breakout", "Tight trailing stop loss"]
  },
];

type View = 'dashboard' | 'playbooks' | 'analytics';
type DateRange = '7D' | '30D' | '90D' | 'All';

function AppContent() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [playbooks] = useState<Playbook[]>(INITIAL_PLAYBOOKS);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [dateRange, setDateRange] = useState<DateRange>('All');
  const [assetFilter, setAssetFilter] = useState<AssetClass>('All');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // ── On mount: validate existing JWT ──────────────────────────────────────────
  useEffect(() => {
    const existingToken = getToken();
    if (!existingToken) {
      setIsAuthReady(true);
      return;
    }

    api.getMe()
      .then(({ user: me }) => {
        setUser(me);
        setIsAuthReady(true);
      })
      .catch(() => {
        clearToken();
        setIsAuthReady(true);
      });
  }, []);

  // ── Load logs when user is authenticated ──────────────────────────
  useEffect(() => {
    if (!user) return;

    api.getLogs()
      .then(fetchedLogs => setLogs(fetchedLogs))
      .catch(err => console.error('Failed to load logs:', err));
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const { token, user: me } = authMode === 'login'
        ? await api.login(authEmail, authPassword)
        : await api.signup(authEmail, authName, authPassword);
      setToken(token);
      setUser(me);
    } catch (err: any) {
      setAuthError(err.message || 'Something went wrong.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setLogs([]);
    setHabits(INITIAL_HABITS);
  };

  const saveLog = async (newLog: DailyLog) => {
    if (!user) return;
    try {
      const saved = await api.saveLog(newLog);
      setLogs(prev => {
        const idx = prev.findIndex(l => l.date === saved.date);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      setIsEntryOpen(false);
    } catch (error) {
      console.error('Failed to save log:', error);
    }
  };

  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    if (assetFilter !== 'All') {
      filtered = filtered.filter(log => log.assetClass === assetFilter);
    }

    if (dateRange !== 'All') {
      const now = new Date();
      const days = dateRange === '7D' ? 7 : dateRange === '30D' ? 30 : 90;
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - days);
      const cutoffStr = format(cutoff, 'yyyy-MM-dd');
      filtered = filtered.filter(log => log.date >= cutoffStr);
    }
    
    return filtered;
  }, [logs, dateRange, assetFilter]);

  const equityData = useMemo(() => {
    let cumulative = 0;
    return filteredLogs
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(log => {
        cumulative += log.performance;
        return {
          date: log.date,
          value: cumulative,
          performance: log.performance
        };
      });
  }, [filteredLogs]);

  const stats = useMemo(() => {
    const winRate = filteredLogs.length > 0 
      ? (filteredLogs.filter(l => l.performance > 0).length / filteredLogs.length) * 100 
      : 0;
    const avgDiscipline = filteredLogs.length > 0
      ? filteredLogs.reduce((acc, l) => acc + l.disciplineScore, 0) / filteredLogs.length
      : 0;
    const currentStreak = [...filteredLogs]
      .sort((a, b) => b.date.localeCompare(a.date))
      .reduce((acc, log) => {
        if (log.performance > 0) return acc + 1;
        return acc; 
      }, 0);
    const totalPnL = filteredLogs.reduce((acc, l) => acc + l.performance, 0);

    return { winRate, avgDiscipline, currentStreak, totalPnL };
  }, [filteredLogs]);


  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center">
        <div className="animate-pulse font-serif italic text-xl">GreenDay Dashboard</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-4">
        <div className="max-w-md w-full border border-[#141414] bg-white p-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-serif italic tracking-tighter mb-2">GreenDay Dashboard</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-50">Performance Calendar</p>
          </div>

          {/* Tab toggle */}
          <div className="flex border border-[#141414] mb-8">
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={cn('flex-1 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors',
                authMode === 'login' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-black/5'
              )}
            >Sign In</button>
            <button
              onClick={() => { setAuthMode('signup'); setAuthError(''); }}
              className={cn('flex-1 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors',
                authMode === 'signup' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-black/5'
              )}
            >Create Account</button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-1">Display Name</label>
                <input
                  type="text"
                  value={authName}
                  onChange={e => setAuthName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full border border-[#141414] px-4 py-3 text-sm bg-transparent outline-none focus:bg-black/5 transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-1">Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-[#141414] px-4 py-3 text-sm bg-transparent outline-none focus:bg-black/5 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-1">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder={authMode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                required
                className="w-full border border-[#141414] px-4 py-3 text-sm bg-transparent outline-none focus:bg-black/5 transition-colors"
              />
            </div>

            {authError && (
              <p className="text-[11px] text-rose-600 font-medium">{authError}</p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#141414] text-[#E4E3E0] uppercase text-xs tracking-widest font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <LogIn size={18} />
              {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-[10px] opacity-40 leading-relaxed uppercase tracking-widest text-center">
            Secure performance tracking for elite operators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-[#141414] bg-[#E4E3E0] z-20 hidden lg:flex flex-col">
        <div className="p-6 border-b border-[#141414]">
          <h1 className="text-xl font-bold tracking-tighter italic font-serif">GreenDay Dashboard</h1>
          <p className="text-[10px] uppercase tracking-widest opacity-50 mt-1">Performance Calendar</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem 
            icon={<Activity size={18} />} 
            label="Dashboard" 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')}
          />
          <NavItem 
            icon={<Brain size={18} />} 
            label="Playbooks" 
            active={activeView === 'playbooks'} 
            onClick={() => setActiveView('playbooks')}
          />
          <NavItem 
            icon={<TrendingUp size={18} />} 
            label="Analytics" 
            active={activeView === 'analytics'} 
            onClick={() => setActiveView('analytics')}
          />
        </nav>

        <div className="p-6 border-t border-[#141414] space-y-4">
          <button 
            onClick={() => exportToCSV(logs)}
            className="w-full flex items-center justify-center gap-2 py-2 border border-[#141414] text-[10px] uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
          >
            <Download size={12} /> Export CSV
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-[#141414] flex items-center justify-center bg-white overflow-hidden">
                <span className="font-serif italic">{user.displayName?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
              <div>
                <p className="text-xs font-bold truncate w-24">{user.displayName}</p>
                <p className="text-[10px] opacity-50">Elite Tier</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-black/5 rounded-none" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8">
        {activeView === 'dashboard' && (
          <>
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <h2 className="text-4xl font-serif italic tracking-tight">Performance Overview</h2>
                <p className="text-sm opacity-60">Tracking behavioral consistency and quantitative success.</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedDate(new Date());
                  setIsEntryOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-[#141414] text-[#E4E3E0] rounded-none hover:opacity-90 transition-opacity uppercase text-xs tracking-widest font-bold"
              >
                <Plus size={16} /> New Entry
              </button>
            </header>

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex border border-[#141414] bg-white">
                {(['All', 'Stocks', 'Crypto'] as AssetClass[]).map((asset) => (
                  <button
                    key={asset}
                    onClick={() => setAssetFilter(asset)}
                    className={cn(
                      "px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors flex items-center gap-2",
                      assetFilter === asset ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-black/5"
                    )}
                  >
                    {asset === 'Stocks' && <Briefcase size={12} />}
                    {asset === 'Crypto' && <Coins size={12} />}
                    {asset === 'All' && <Layers size={12} />}
                    {asset}
                  </button>
                ))}
              </div>

              <div className="flex border border-[#141414] bg-white">
                {(['7D', '30D', '90D', 'All'] as DateRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={cn(
                      "px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors",
                      dateRange === range ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-black/5"
                    )}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-[#141414] border border-[#141414] mb-12">
              <StatCard 
                label="Total P&L" 
                value={stats.totalPnL >= 0 ? `+${assetFilter === 'Stocks' ? '₹' : '$'}${stats.totalPnL.toLocaleString()}` : `-${assetFilter === 'Stocks' ? '₹' : '$'}${Math.abs(stats.totalPnL).toLocaleString()}`} 
                sub="Cumulative performance" 
                trend={stats.totalPnL > 0 ? 'up' : stats.totalPnL < 0 ? 'down' : undefined}
              />
              <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} sub="Positive performance days" />
              <StatCard label="Discipline Score" value={Math.round(stats.avgDiscipline).toString()} sub="Protocol adherence avg" />
              <StatCard label="Current Streak" value={`${stats.currentStreak} Days`} sub="Consecutive green days" />
            </div>


            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif italic text-xl">Performance Calendar</h3>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-black/5"><ChevronLeft size={20} /></button>
                    <span className="text-sm font-bold uppercase tracking-widest">{format(currentDate, 'MMMM yyyy')}</span>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-black/5"><ChevronRight size={20} /></button>
                  </div>
                </div>
                <Calendar 
                  currentDate={currentDate} 
                  logs={logs} 
                  onSelectDate={(date) => {
                    setSelectedDate(date);
                    setIsEntryOpen(true);
                  }} 
                />
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif italic text-xl">Equity Curve</h3>
                  <div className="flex bg-black/5 p-1 border border-[#141414]">
                    {(['7D', '30D', '90D', 'All'] as DateRange[]).map((range) => (
                      <button
                        key={range}
                        onClick={() => setDateRange(range)}
                        className={cn(
                          "px-3 py-1 text-[10px] uppercase tracking-widest font-bold transition-colors",
                          dateRange === range ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-black/10"
                        )}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[400px] w-full border border-[#141414] bg-white p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#141414" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#141414" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#141414" 
                        fontSize={10} 
                        tickFormatter={(str) => format(new Date(str), 'MMM d')}
                        minTickGap={30}
                      />
                      <YAxis stroke="#141414" fontSize={10} tickFormatter={(val) => val > 0 ? `+${val}` : val} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-[#141414] text-[#E4E3E0] p-3 border border-[#E4E3E0]/20 shadow-xl text-[10px] uppercase tracking-widest">
                                <p className="font-bold opacity-50 mb-1">{format(new Date(data.date), 'MMMM d, yyyy')}</p>
                                <div className="flex justify-between gap-8">
                                  <span>Equity</span>
                                  <span className={cn("font-serif italic text-sm", data.value >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                    {data.value >= 0 ? `+$${data.value.toLocaleString()}` : `-$${Math.abs(data.value).toLocaleString()}`}
                                  </span>
                                </div>
                                <div className="flex justify-between gap-8 mt-1">
                                  <span>Daily Perf</span>
                                  <span className={cn(data.performance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                    {data.performance >= 0 ? `+${assetFilter === 'Stocks' ? '₹' : '$'}${data.performance.toLocaleString()}` : `-${assetFilter === 'Stocks' ? '₹' : '$'}${Math.abs(data.performance).toLocaleString()}`}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#141414" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" animationDuration={1000} />
                      <Brush 
                        dataKey="date" 
                        height={30} 
                        stroke="#141414" 
                        fill="#E4E3E0"
                        tickFormatter={(str) => format(new Date(str), 'MMM d')}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          </>
        )}

        {activeView === 'playbooks' && (
          <div className="max-w-4xl">
            <header className="mb-12">
              <h2 className="text-4xl font-serif italic tracking-tight">Strategy Playbooks</h2>
              <p className="text-sm opacity-60">Explicit rules for your personal strategies.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {playbooks.map(playbook => {
                const playbookLogs = filteredLogs.filter(l => l.playbookIds?.includes(playbook.id));
                const totalPerf = playbookLogs.reduce((sum, l) => sum + l.performance, 0);
                const winRate = playbookLogs.length > 0 
                  ? (playbookLogs.filter(l => l.performance > 0).length / playbookLogs.length * 100).toFixed(0)
                  : 0;

                return (
                  <PlaybookCard 
                    key={playbook.id}
                    title={playbook.title} 
                    icon={<PlaybookIcon icon={playbook.icon} className={playbook.color} />}
                    rules={playbook.rules}
                    currencySymbol={assetFilter === 'Stocks' ? '₹' : '$'}
                    stats={{
                      usage: playbookLogs.length,
                      performance: totalPerf,
                      winRate: Number(winRate)
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {activeView === 'analytics' && (
          <div className="space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <h2 className="text-4xl font-serif italic tracking-tight">Strategy Efficiency</h2>
                <p className="text-sm opacity-60">Quantitative analysis of your playbook performance.</p>
              </div>
              <div className="flex border border-[#141414] bg-white">
                {(['All', 'Stocks', 'Crypto'] as AssetClass[]).map((asset) => (
                  <button
                    key={asset}
                    onClick={() => setAssetFilter(asset)}
                    className={cn(
                      "px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors flex items-center gap-2",
                      assetFilter === asset ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-black/5"
                    )}
                  >
                    {asset === 'Stocks' && <Briefcase size={12} />}
                    {asset === 'Crypto' && <Coins size={12} />}
                    {asset === 'All' && <Layers size={12} />}
                    {asset}
                  </button>
                ))}
              </div>
            </header>

            <div className="grid grid-cols-1 gap-8">
              <div className="border border-[#141414] bg-white p-8">
                <h3 className="text-xl font-serif italic mb-8">P&L by Strategy</h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={playbooks.map(p => {
                      const playbookLogs = filteredLogs.filter(l => l.playbookIds?.includes(p.id));
                      const totalPerf = playbookLogs.reduce((sum, l) => sum + l.performance, 0);
                      return {
                        name: p.title,
                        performance: totalPerf
                      };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#141414', fontWeight: 'bold' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#141414' }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        contentStyle={{ 
                          backgroundColor: '#141414', 
                          border: 'none', 
                          color: '#E4E3E0',
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em'
                        }}
                      />
                      <Bar 
                        dataKey="performance" 
                        fill="#141414" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {playbooks.map(p => {
                  const playbookLogs = filteredLogs.filter(l => l.playbookIds?.includes(p.id));
                  const totalPerf = playbookLogs.reduce((sum, l) => sum + l.performance, 0);
                  const winRate = playbookLogs.length > 0 
                    ? (playbookLogs.filter(l => l.performance > 0).length / playbookLogs.length * 100).toFixed(0)
                    : 0;
                  
                  return (
                    <div key={p.id} className="border border-[#141414] bg-white p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <PlaybookIcon icon={p.icon} className={p.color} size={14} />
                        <h4 className="text-sm font-serif italic">{p.title}</h4>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[8px] uppercase tracking-widest opacity-50">Total P&L</p>
                          <p className={cn(
                            "text-xl font-serif italic",
                            totalPerf > 0 ? "text-emerald-600" : totalPerf < 0 ? "text-rose-600" : ""
                          )}>
                             {totalPerf >= 0 ? `+${assetFilter === 'Stocks' ? '₹' : '$'}${totalPerf.toLocaleString()}` : `-${assetFilter === 'Stocks' ? '₹' : '$'}${Math.abs(totalPerf).toLocaleString()}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] uppercase tracking-widest opacity-50">Win Rate</p>
                          <p className="text-sm font-bold">{winRate}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Entry Modal */}
      {isEntryOpen && selectedDate && (
        <EntryForm 
          date={selectedDate} 
          onClose={() => setIsEntryOpen(false)} 
          onSave={saveLog}
          existingLog={logs.find(l => l.date === format(selectedDate, 'yyyy-MM-dd'))}
          playbooks={playbooks}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function PlaybookIcon({ icon, size = 16, className = "" }: { icon: string, size?: number, className?: string }) {
  switch (icon) {
    case 'Zap': return <Zap size={size} className={className} />;
    case 'ShieldAlert': return <ShieldAlert size={size} className={className} />;
    case 'BookOpen': return <BookOpen size={size} className={className} />;
    case 'Target': return <Target size={size} className={className} />;
    case 'Activity': return <Activity size={size} className={className} />;
    default: return <BookOpen size={size} className={className} />;
  }
}

function PlaybookCard({ title, icon, rules, stats, currencySymbol = '$' }: { 
  title: string, 
  icon: React.ReactNode, 
  rules: string[],
  currencySymbol?: string,
  stats?: { usage: number, performance: number, winRate: number }
}) {
  return (
    <div className="border border-[#141414] bg-white p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-black/5">
          {icon}
        </div>
        <h3 className="text-xl font-serif italic">{title}</h3>
      </div>
      
      <div className="space-y-4 mb-8">
        {rules.map((rule, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="mt-1.5 w-1 h-1 bg-[#141414] rounded-full shrink-0" />
            <p className="text-xs opacity-70 leading-relaxed">{rule}</p>
          </div>
        ))}
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#141414]">
          <div>
            <p className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Usage</p>
            <p className="text-sm font-serif italic">{stats.usage} Days</p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-widest opacity-50 mb-1">P&L</p>
            <p className={cn(
              "text-sm font-serif italic",
              stats.performance > 0 ? "text-emerald-600" : stats.performance < 0 ? "text-rose-600" : ""
            )}>
              {stats.performance >= 0 ? `+${currencySymbol}${stats.performance.toLocaleString()}` : `-${currencySymbol}${Math.abs(stats.performance).toLocaleString()}`}
            </p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Win Rate</p>
            <p className="text-sm font-serif italic">{stats.winRate}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
