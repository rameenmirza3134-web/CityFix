import React, { useState } from 'react';
import {
  X,
  MapPin,
  CloudSun,
  Building2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Trash2,
  Calendar,
  ShieldAlert,
  Send
} from 'lucide-react';
import { Complaint, ComplaintStatus, SeverityLevel, WeatherData } from '../types';

interface ComplaintDetailsModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: ComplaintStatus) => void;
  onDelete: (id: string) => void;
}

export const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({
  complaint,
  onClose,
  onStatusChange,
  onDelete
}) => {
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  if (!complaint) return null;

  const handleCopyNotice = () => {
    if (!complaint.complaint_text) return;
    navigator.clipboard.writeText(complaint.complaint_text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
            Critical Severity
          </span>
        );
      case 'High':
        return (
          <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
            High Severity
          </span>
        );
      case 'Medium':
        return (
          <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-pink-100 dark:bg-pink-500/20 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30">
            Medium Severity
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
            Low Severity
          </span>
        );
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
    ? new Date(complaint.created_at).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'Recently';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#16111a] border border-pink-100 dark:border-pink-950/80 rounded-2xl shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-pink-100 dark:border-pink-950/70 flex items-center justify-between bg-pink-50/30 dark:bg-[#120e16]">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Report Details
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-200/80 dark:border-pink-900/40">
              #{complaint.id.slice(0, 8)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#201726] transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top visual banner & quick facts */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Image */}
            <div className="md:col-span-5">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-pink-100 dark:border-pink-950 aspect-video md:aspect-square flex items-center justify-center">
                <img
                  src={complaint.image_url}
                  alt={complaint.problem}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Quick Details */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {getSeverityBadge(complaint.severity)}

                {complaint.problem_category && (
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-pink-50 dark:bg-[#201726] text-pink-700 dark:text-pink-300 border border-pink-200/80 dark:border-pink-900/40">
                    {complaint.problem_category}
                  </span>
                )}
              </div>

              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {complaint.problem}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {complaint.description}
                </p>
              </div>

              {/* Department badge */}
              {complaint.department && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-pink-50 dark:bg-[#201726] px-3 py-1.5 rounded-xl border border-pink-100 dark:border-pink-900/40 w-fit">
                  <Building2 className="w-4 h-4 text-pink-500" />
                  <span>Responsible Authority: {complaint.department}</span>
                </div>
              )}

              {/* Metadata list */}
              <div className="pt-2 border-t border-pink-100/60 dark:border-pink-950/60 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-pink-500 shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {complaint.location_name || `${complaint.latitude?.toFixed(4)}, ${complaint.longitude?.toFixed(4)}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Logged at: {formattedDate}</span>
                </div>

                {weatherObj && (
                  <div className="flex items-center gap-2">
                    <CloudSun className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      Weather recorded: {weatherObj.temperature}°C, {weatherObj.condition} (Wind {weatherObj.wind_speed} km/h, Humidity {weatherObj.humidity}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Citizen Safety Advice */}
          {complaint.citizen_safety_tip && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-950 dark:text-amber-300">Public Safety Advisory: </strong>
                <span>{complaint.citizen_safety_tip}</span>
              </div>
            </div>
          )}

          {/* Formal Civic Grievance Text */}
          {complaint.complaint_text && (
            <div className="p-5 rounded-2xl bg-pink-50/40 dark:bg-[#110c14] border border-pink-100 dark:border-pink-950 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <FileText className="w-4 h-4 text-pink-500" />
                  <span>Formal Municipal Notice & Letter</span>
                </div>
                <button
                  onClick={handleCopyNotice}
                  className="flex items-center gap-1.5 text-xs font-semibold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1e1524] border border-pink-200/80 dark:border-pink-900/40 shadow-xs cursor-pointer"
                >
                  {copiedNotice ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-pink-500" />
                      <span>Copied to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Notice</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white dark:bg-[#16111a] p-4 rounded-xl border border-pink-100 dark:border-pink-950 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
                {complaint.complaint_text}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 border-t border-pink-100 dark:border-pink-950/70 bg-pink-50/30 dark:bg-[#120e16] flex flex-wrap items-center justify-between gap-3">
          {/* Status Update Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Status:</span>
            <select
              value={complaint.status}
              onChange={(e) => onStatusChange(complaint.id, e.target.value as ComplaintStatus)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-[#201726] border border-pink-200 dark:border-pink-900/50 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-xl">
                <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">Confirm delete?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(complaint.id);
                    onClose();
                  }}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  No
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
