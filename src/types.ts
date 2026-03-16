export type Emotion = 'Calm' | 'FOMO' | 'Stressed' | 'Motivated' | 'Disciplined' | 'Anxious' | 'Confident';
export type AssetClass = 'Stocks' | 'Crypto' | 'All';

export interface DailyLog {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  performance: number; // Total P&L value for the day
  emotions: Emotion[];
  notes: string;
  disciplineScore: number; // 0 to 100
  playbookIds: string[];
  assetClass: AssetClass;
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
  playbooks: Playbook[];
}
