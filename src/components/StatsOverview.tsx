import React from 'react';
import { Layers, Clock, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { ComplaintStats } from '../types';

interface StatsOverviewProps {
  stats: ComplaintStats;
  currentFilter: string;
  onFilterChange: (filter: string) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  currentFilter,
  onFilterChange,
}) => {
  const cards = [
    {
      id: 'all',
      title: 'Total Reports',
      value: stats.total,
      icon: Layers,
      valueClass: 'text-white',
      accentBorder: 'hover:border-blue-500',
      activeRing: 'ring-1 ring-blue-500 border-blue-500'
    },
    {
      id: 'pending',
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      valueClass: 'text-yellow-500',
      accentBorder: 'hover:border-yellow-500',
      activeRing: 'ring-1 ring-yellow-500 border-yellow-500'
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      value: stats.in_progress,
      icon: Activity,
      valueClass: 'text-blue-400',
      accentBorder: 'hover:border-blue-400',
      activeRing: 'ring-1 ring-blue-400 border-blue-400'
    },
    {
      id: 'resolved',
      title: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle,
      valueClass: 'text-green-500',
      accentBorder: 'hover:border-green-500',
      activeRing: 'ring-1 ring-green-500 border-green-500'
    },
    {
      id: 'high_critical',
      title: 'Critical',
      value: stats.high_or_critical,
      icon: AlertTriangle,
      valueClass: 'text-red-500',
      accentBorder: 'hover:border-red-500',
      activeRing: 'ring-1 ring-red-500 border-red-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => {
        const isActive = currentFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onFilterChange(card.id)}
            className={`p-4 rounded-xl border bg-[#161616] text-left transition-all duration-150 relative overflow-hidden ${
              isActive
                ? `${card.activeRing} bg-[#1a1a1a]`
                : `border-slate-800 ${card.accentBorder}`
            }`}
          >
            <span className="text-[11px] font-mono text-slate-500 uppercase font-bold tracking-wider block">
              {card.title}
            </span>
            <div className={`text-2xl font-bold mt-1 font-mono tracking-tight ${card.valueClass}`}>
              {card.value}
            </div>
          </button>
        );
      })}
    </div>
  );
};
