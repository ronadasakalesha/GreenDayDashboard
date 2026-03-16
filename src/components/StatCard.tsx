import React from 'react';
import { cn } from '../lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
}

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-[#E4E3E0] p-6">
      <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">{label}</p>
      <p className="text-3xl font-serif italic mb-1">{value}</p>
      <p className="text-[10px] opacity-40">{sub}</p>
    </div>
  );
}
