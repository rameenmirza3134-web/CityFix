import React, { useRef } from 'react';
import { Upload, Camera, Sparkles, CloudRain, Search, Database, CheckCircle2, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onImageSelected: (base64: string, mimeType: string) => void;
}

const SAMPLE_ISSUES = [
  {
    name: 'Severe Pothole',
    category: 'Road Hazard',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    desc: 'Deep asphalt cavity on roadway'
  },
  {
    name: 'Garbage Buildup',
    category: 'Sanitation',
    url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    desc: 'Overflowing bins & street litter'
  },
  {
    name: 'Water Main Leak',
    category: 'Utility Fault',
    url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
    desc: 'Street flooding & water wastage'
  },
  {
    name: 'Broken Streetlight',
    category: 'Public Safety',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    desc: 'Exposed wire & dark crosswalk'
  }
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImageSelected(reader.result, file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImageSelected(reader.result, file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const loadSample = async (sampleUrl: string) => {
    try {
      // Fetch sample image and convert to base64
      const response = await fetch(sampleUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onImageSelected(reader.result, blob.type || 'image/jpeg');
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.warn('Could not load sample directly, passing url:', err);
      // Fallback
      onImageSelected(sampleUrl, 'image/jpeg');
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-10 bg-[#0a0a0a] text-slate-100 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center bg-[#161616] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Main Requested Headline */}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight mb-3">
            Report a Problem.<br />
            <span className="text-blue-500">Let AI Handle the Rest.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
            Upload a photo of an urban issue and our AI agent will analyze severity, check local weather, and file a structured complaint automatically.
          </p>

          {/* Large Upload Image Action Area */}
          <div className="mt-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="main-file-upload-input"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
              id="main-camera-input"
            />

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="p-6 sm:p-10 rounded-xl bg-[#1a1a1a] border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-blue-500/5 transition-all duration-200 group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-500 group-hover:scale-105 group-hover:border-blue-500 transition-all">
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <span className="text-base sm:text-lg font-semibold text-white block">
                    Upload Photo
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block">
                    JPEG, PNG, WebP up to 10MB • Click or drag & drop
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    <span>Snap with Camera</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry metadata bars */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="bg-[#1a1a1a] p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-mono text-slate-400 truncate">
                GPS: 37.7749° N, 122.4194° W (Active)
              </span>
            </div>
            <div className="bg-[#1a1a1a] p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <CloudRain className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-xs font-mono text-slate-400 truncate">
                Weather: Live Open-Meteo Integration
              </span>
            </div>
          </div>

          {/* Quick Test Drive with Sample Photos */}
          <div className="mt-6 text-left bg-[#1a1a1a] rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-400">
                1-Click Civic Test Samples:
              </span>
              <span className="text-[11px] text-blue-400 font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Quick Demo
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SAMPLE_ISSUES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => loadSample(sample.url)}
                  className="group relative flex flex-col p-2 rounded-lg bg-[#161616] hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 text-left transition-all"
                >
                  <div className="w-full h-16 rounded-md overflow-hidden mb-1.5 bg-slate-900">
                    <img
                      src={sample.url}
                      alt={sample.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 truncate">
                    {sample.name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate font-mono">
                    {sample.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Feature Pillars */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left font-mono">
            <div className="p-2.5 rounded-lg bg-[#1a1a1a] border border-slate-800 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-slate-200">Gemini Vision</p>
                <p className="text-[10px] text-slate-500">Defect detection</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#1a1a1a] border border-slate-800 flex items-start gap-2">
              <CloudRain className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-slate-200">Open-Meteo</p>
                <p className="text-[10px] text-slate-500">Hazard modeling</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#1a1a1a] border border-slate-800 flex items-start gap-2">
              <Search className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-slate-200">Tavily Search</p>
                <p className="text-[10px] text-slate-500">Civic routing</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#1a1a1a] border border-slate-800 flex items-start gap-2">
              <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-slate-200">Supabase</p>
                <p className="text-[10px] text-slate-500">Cloud database</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
