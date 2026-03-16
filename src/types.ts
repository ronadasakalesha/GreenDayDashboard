export type Emotion = 'Calm' | 'FOMO' | 'Stressed' | 'Motivated' | 'Disciplined' | 'Anxious' | 'Confident';
export type AssetClass = 'Stocks' | 'Crypto' | 'All';

export interface DailyLog {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  performance: number; // Numeric value representing "P&L" or success level (-10 to 10)
  emotions: Emotion[];
  notes: string;
  disciplineScore: number; // 0 to 100
  habits: {
    id: string;
    completed: boolean;
  }[];
  playbookIds: string[];
  assetClass: AssetClass;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Playbook {
  id: string;
  title: string;
  icon: string;
  color: string;
  rules: string[];
}

export interface AppState {
  logs: DailyLog[];
  habits: Habit[];
  playbooks: Playbook[];
}
