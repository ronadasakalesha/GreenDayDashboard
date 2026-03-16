import React from 'react';
import { cn } from '../lib/utils';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function NavItem({ icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors text-left",
        active ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-black/5"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
