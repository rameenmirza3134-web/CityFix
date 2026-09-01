import React from 'react';
import { Sparkles, Database, CloudSun, Plus, Compass } from 'lucide-react';
import { ConfigStatus } from '../types';

interface NavbarProps {
  configStatus: ConfigStatus | null;
  onOpenReport: () => void;
  onOpenSupabaseModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  configStatus,
  onOpenReport,
  onOpenSupabaseModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#111111]/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/30">
            C
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">
                CityFix <span className="text-blue-500">AI</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                Civic Agent
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block font-mono text-[11px]">
              Active Network: Metropolis-01
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Agent Stack Badges */}
          <div className="hidden md:flex items-center gap-2.5 text-xs bg-[#1a1a1a] px-3.5 py-1.5 rounded-xl border border-slate-800 font-mono">
            <div className="flex items-center gap-1.5 text-slate-300" title="Powered by Gemini Vision">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">GEMINI-PRO</span>
            </div>
            <span className="text-slate-700">::</span>
            <div className="flex items-center gap-1.5 text-slate-300" title="Live Weather by Open-Meteo">
              <CloudSun className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px]">OPEN-METEO</span>
            </div>
            <span className="text-slate-700">::</span>
            <button
              onClick={onOpenSupabaseModal}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
              title="Click to view Supabase connection & schema"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="text-[11px]">SUPABASE {configStatus?.hasSupabase ? 'ACTIVE' : 'READY'}</span>
            </button>
          </div>

          {/* Supabase SQL Button for mobile */}
          <button
            onClick={onOpenSupabaseModal}
            className="md:hidden p-2 rounded-xl bg-[#1a1a1a] text-emerald-400 border border-slate-800 text-xs flex items-center gap-1"
            title="Database Status"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* New Report Action Button */}
          <button
            id="navbar-report-btn"
            onClick={onOpenReport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Report Issue</span>
            <span className="sm:hidden">Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
