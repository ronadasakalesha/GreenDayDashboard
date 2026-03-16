import { DailyLog } from '../types';

export function exportToCSV(logs: DailyLog[]) {
  if (logs.length === 0) return;

  const headers = ['Date', 'Performance', 'Discipline Score', 'Emotions', 'Notes', 'Habits Completed'];
  const rows = logs.map(log => [
    log.date,
    log.performance,
    log.disciplineScore,
    log.emotions.join(';'),
    log.notes.replace(/"/g, '""'),
    log.habits.filter(h => h.completed).length
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `zenith_logs_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
