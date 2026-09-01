import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Trash2,
  Inbox,
  Sun,
  Moon,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Heart
} from 'lucide-react';
import { Complaint, ComplaintStatus } from './types';
import {
  fetchComplaints,
  updateComplaintStatus,
  deleteComplaint,
  clearAllComplaints
} from './services/api';
import { SimpleReporter } from './components/SimpleReporter';
import { ComplaintCard } from './components/ComplaintCard';
import { ComplaintDetailsModal } from './components/ComplaintDetailsModal';

export default function App() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('cityfix_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Modal states
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  useEffect(() => {
    const isDark = theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    try {
      localStorage.setItem('cityfix_theme', theme);
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }
  }, [theme]);

  useEffect(() => {
    loadData();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await fetchComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleComplaintSaved = (newComplaint: Complaint) => {
    setComplaints((prev) => [newComplaint, ...prev.filter((c) => c.id !== newComplaint.id)]);
  };

  const handleStatusChange = async (id: string, newStatus: ComplaintStatus) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
    if (selectedComplaint && selectedComplaint.id === id) {
      setSelectedComplaint((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      await updateComplaintStatus(id, newStatus);
    } catch (err) {
      console.error('Status update failed, reloading data:', err);
      loadData();
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    setComplaints((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteComplaint(id);
    } catch (err) {
      console.error('Delete failed:', err);
      loadData();
    }
  };

  const handleClearAll = async () => {
    setComplaints([]);
    setConfirmClearAll(false);
    try {
      await clearAllComplaints();
    } catch (err) {
      console.error('Clear all failed:', err);
      loadData();
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (selectedFilter === 'All') return true;
    return c.status === selectedFilter;
  });

  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0e0a10] text-slate-100' : 'bg-[#fdf8fa] text-slate-800'
    }`}>
      <div>
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#16111a]/90 backdrop-blur-md border-b border-pink-100 dark:border-pink-950/60 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500 dark:bg-pink-600 flex items-center justify-center font-bold text-white shadow-sm shadow-pink-500/20">
                <span className="font-display text-lg tracking-tight">CF</span>
              </div>
              <div>
                <h1 className="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-1">
                  <span>City</span>
                  <span className="text-pink-500 dark:text-pink-400">Fix</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Community Issue Reporter
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-pink-50 dark:bg-[#201726] hover:bg-pink-100 dark:hover:bg-[#2a1e32] text-pink-700 dark:text-pink-300 border border-pink-200/80 dark:border-pink-900/40 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-xs"
                title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-pink-700" />
                    <span className="hidden sm:inline">Dark Mode</span>
                  </>
                )}
              </button>

              {/* Refresh / Sync Button */}
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#201726] hover:bg-slate-50 dark:hover:bg-[#2a1e32] text-xs font-semibold text-slate-700 dark:text-slate-300 border border-pink-100 dark:border-pink-900/40 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                title="Refresh issues list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-pink-500' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
          {/* Main Issue Reporter Component */}
          <SimpleReporter onComplaintSaved={handleComplaintSaved} isDark={theme === 'dark'} />

          {/* Reported Grievances Registry */}
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-pink-100 dark:border-pink-950/60 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Submitted Reports
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900/40">
                    {complaints.length} Total
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Track, update, and manage public infrastructure reports across your area.
                </p>
              </div>

              {/* Status Filter Tabs & Clear Action */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center bg-pink-50/80 dark:bg-[#16111a] border border-pink-100 dark:border-pink-950/70 rounded-xl p-1 text-xs font-medium">
                  {[
                    { id: 'All', label: 'All', count: complaints.length },
                    { id: 'Pending', label: 'Pending', count: pendingCount },
                    { id: 'In Progress', label: 'In Progress', count: inProgressCount },
                    { id: 'Resolved', label: 'Resolved', count: resolvedCount }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedFilter === filter.id
                          ? 'bg-pink-500 text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-300'
                      }`}
                    >
                      <span>{filter.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                        selectedFilter === filter.id
                          ? 'bg-pink-600/60 text-white'
                          : 'bg-white/80 dark:bg-[#201726] text-slate-600 dark:text-slate-400'
                      }`}>
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>

                {complaints.length > 0 && (
                  !confirmClearAll ? (
                    <button
                      onClick={() => setConfirmClearAll(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#16111a] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs text-rose-600 dark:text-rose-400 border border-pink-100 dark:border-pink-950 font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-xl">
                      <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">Delete all?</span>
                      <button
                        onClick={handleClearAll}
                        className="px-2.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmClearAll(false)}
                        className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Complaints List / Grid */}
            {loading ? (
              <div className="py-20 text-center space-y-3 rounded-2xl bg-white dark:bg-[#16111a] border border-pink-100 dark:border-pink-950/60 shadow-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-pink-500 mx-auto" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading neighborhood reports...</p>
              </div>
            ) : filteredComplaints.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredComplaints.map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onSelect={(c) => setSelectedComplaint(c)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteComplaint}
                  />
                ))}
              </div>
            ) : (
              /* Clean Empty State */
              <div className="py-16 px-6 rounded-2xl bg-white dark:bg-[#16111a] border border-pink-100 dark:border-pink-950/60 text-center space-y-3 max-w-md mx-auto shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center text-pink-400 mx-auto border border-pink-100 dark:border-pink-900/30">
                  <Inbox className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-slate-800 dark:text-slate-200">
                    {selectedFilter === 'All'
                      ? 'No issues reported yet'
                      : `No reports matching "${selectedFilter}"`}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Submit a photo of an issue above to record and track repairs in your neighborhood.
                  </p>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Clean Civic Footer */}
      <footer className="border-t border-pink-100 dark:border-pink-950/60 bg-white dark:bg-[#16111a] py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-pink-500 dark:bg-pink-600 rounded-md flex items-center justify-center text-[10px] font-bold text-white">
              CF
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">CityFix</span>
            <span>—</span>
            <span>Community Infrastructure & Civic Issue Management</span>
          </div>
          <p className="text-slate-400 dark:text-slate-500">
            Dedicated to cleaner, safer, and well-maintained public spaces.
          </p>
        </div>
      </footer>

      {/* Details Modal */}
      <ComplaintDetailsModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteComplaint}
      />
    </div>
  );
}
