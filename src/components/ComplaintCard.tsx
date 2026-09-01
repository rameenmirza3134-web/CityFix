import React, { useState } from 'react';
import {
  MapPin,
  CloudSun,
  Building2,
  Trash2,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { Complaint, ComplaintStatus, SeverityLevel, WeatherData } from '../types';

interface ComplaintCardProps {
  complaint: Complaint;
  onSelect: (complaint: Complaint) => void;
  onStatusChange: (id: string, newStatus: ComplaintStatus) => void;
  onDelete?: (id: string) => void;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  onSelect,
  onStatusChange,
  onDelete
}) => {
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-pink-100 dark:bg-pink-500/20 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30">
            Medium
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
            Low
          </span>
        );
    }
  };

  const getStatusStyles = (status: ComplaintStatus) => {
    switch (status) {
      case 'Resolved':
        return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
      case 'In Progress':
        return 'text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20';
      case 'Pending':
      default:
        return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
    }
  };

  const parseWeather = (w: WeatherData | string | undefined): WeatherData | null => {
    if (!w) return null;
    if (typeof w === 'object') return w;
    try {
      return JSON.parse(w);
    } catch {
      return null;
    }
  };

  const weatherObj = parseWeather(complaint.weather);

  const formattedDate = complaint.created_at
    ? new Date(complaint.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      })
    : 'Recent';

  return (
    <div
      onClick={() => onSelect(complaint)}
      className="group relative bg-white dark:bg-[#16111a] rounded-2xl border border-pink-100/90 dark:border-pink-950/70 hover:border-pink-400 dark:hover:border-pink-500/50 transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md cursor-pointer"
    >
      <div>
        {/* Photo Container */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-[#0e0a10]">
          <img
            src={complaint.image_url}
            alt={complaint.problem}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />

          {/* Top severity badge & date pill */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {getSeverityBadge(complaint.severity)}
          </div>

          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-[#16111a]/90 backdrop-blur-md text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-pink-100 dark:border-pink-900/40 shadow-xs flex items-center gap-1">
            <Calendar className="w-3 h-3 text-pink-400" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3.5">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors tracking-tight">
              {complaint.problem}
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {complaint.description}
            </p>
          </div>

          {/* Department badge */}
          {complaint.department && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-pink-50/70 dark:bg-[#201726] px-2.5 py-1 rounded-lg border border-pink-100 dark:border-pink-900/40 w-fit">
              <Building2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              <span className="truncate max-w-[220px]">{complaint.department}</span>
            </div>
          )}

          {/* Location & Weather */}
          <div className="pt-3 border-t border-pink-100/60 dark:border-pink-950/60 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                {complaint.location_name || `${complaint.latitude?.toFixed(4)}, ${complaint.longitude?.toFixed(4)}`}
              </span>
            </div>

            {weatherObj && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs">
                <CloudSun className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span className="truncate font-medium">
                  {weatherObj.temperature}°C • {weatherObj.condition}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Controls */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="px-5 py-3 bg-pink-50/40 dark:bg-[#120e16] border-t border-pink-100/80 dark:border-pink-950/60 flex items-center justify-between gap-3"
      >
        {/* Status Dropdown */}
        <div>
          <select
            value={complaint.status}
            onChange={(e) => onStatusChange(complaint.id, e.target.value as ComplaintStatus)}
            className={`text-xs font-semibold py-1 px-2.5 rounded-lg border appearance-none outline-none cursor-pointer transition-all ${getStatusStyles(complaint.status)}`}
          >
            <option value="Pending" className="bg-white dark:bg-[#16111a] text-slate-900 dark:text-slate-100">Pending</option>
            <option value="In Progress" className="bg-white dark:bg-[#16111a] text-slate-900 dark:text-slate-100">In Progress</option>
            <option value="Resolved" className="bg-white dark:bg-[#16111a] text-slate-900 dark:text-slate-100">Resolved</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {onDelete && (
            !confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                title="Delete this complaint"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-lg">
                <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">Delete?</span>
                <button
                  type="button"
                  onClick={() => onDelete(complaint.id)}
                  className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-[11px] font-bold text-white transition-colors cursor-pointer"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  No
                </button>
              </div>
            )
          )}

          {/* View Report Trigger */}
          <button
            type="button"
            onClick={() => onSelect(complaint)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors py-1 px-2 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-500/10 cursor-pointer"
          >
            <span>View Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
