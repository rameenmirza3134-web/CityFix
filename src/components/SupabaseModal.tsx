import React, { useState } from 'react';
import { X, Database, Copy, Check, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ConfigStatus } from '../types';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  configStatus: ConfigStatus | null;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  configStatus,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const sqlSchema = `-- ==========================================
-- CityFix AI - Supabase Schema & Storage Setup
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create the complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  problem TEXT NOT NULL,
  problem_category TEXT,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  severity_reason TEXT,
  recommended_action TEXT,
  department TEXT,
  citizen_safety_tip TEXT,
  complaint_text TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  location_name TEXT,
  weather JSONB,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Review', 'In Progress', 'Resolved')),
  image_url TEXT NOT NULL,
  tavily_researched BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- 3. Allow public read and write access for civic reporting
CREATE POLICY "Public read complaints" ON complaints
  FOR SELECT USING (true);

CREATE POLICY "Public insert complaints" ON complaints
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update complaint status" ON complaints
  FOR UPDATE USING (true);

-- 4. Create Storage Bucket for complaint photos (complaint-images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-images', 'complaint-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access Complaint Images" ON storage.objects
  FOR SELECT USING (bucket_id = 'complaint-images');

CREATE POLICY "Public Upload Complaint Images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'complaint-images');
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#111111] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#111111]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-white">
                Supabase Integration & Database Schema
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                PostgreSQL table & Storage Bucket for CityFix AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            configStatus?.hasSupabase
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : 'bg-[#161616] border-slate-800 text-slate-300'
          }`}>
            {configStatus?.hasSupabase ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Database className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            )}
            <div className="text-xs font-mono">
              <p className="font-bold text-xs text-white">
                {configStatus?.hasSupabase
                  ? 'Supabase Connected & Active'
                  : 'Operating in Fast Local Mode with Supabase Ready'}
              </p>
              <p className="mt-1 leading-relaxed text-slate-400 text-[11px]">
                {configStatus?.hasSupabase
                  ? `Your app is directly synchronized with Supabase (${configStatus.supabaseUrl}). All complaints and images are stored in the cloud.`
                  : 'You can provide SUPABASE_URL and SUPABASE_ANON_KEY in your settings to connect a live Supabase project anytime. In the meantime, CityFix AI operates seamlessly with full Gemini AI, Open-Meteo weather, and local caching.'}
              </p>
            </div>
          </div>

          {/* Copy SQL Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                1-Click Supabase Table & Storage SQL:
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold shadow transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#0a0a0a] text-slate-300 text-xs font-mono overflow-x-auto max-h-60 border border-slate-800 leading-relaxed">
              {sqlSchema}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-800 bg-[#111111]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold shadow transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
