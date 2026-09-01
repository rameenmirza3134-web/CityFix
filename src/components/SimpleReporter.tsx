import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Camera,
  MapPin,
  CloudSun,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Building2,
  ShieldAlert,
  Send,
  RefreshCw,
  X,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import { Complaint, WeatherData } from '../types';
import { analyzeIssueWithAI, fetchLiveWeather, saveComplaint } from '../services/api';

interface SimpleReporterProps {
  onComplaintSaved: (complaint: Complaint) => void;
  isDark?: boolean;
}

export const SimpleReporter: React.FC<SimpleReporterProps> = ({ onComplaintSaved, isDark }) => {
  // Photo state
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');

  // Location & Weather state
  const [latitude, setLatitude] = useState<number>(37.7749);
  const [longitude, setLongitude] = useState<number>(-122.4194);
  const [locationName, setLocationName] = useState<string>('Civic Center, San Francisco');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);

  // Analysis & Submission state
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Draft Complaint Result
  const [draft, setDraft] = useState<Partial<Complaint> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial location & weather on mount
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    setLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          setLocationName(`GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          setLocating(false);
          loadWeather(lat, lon);
        },
        (error) => {
          console.warn('Geolocation unavailable, using default coordinates:', error);
          setLocating(false);
          loadWeather(latitude, longitude);
        },
        { timeout: 8000 }
      );
    } else {
      setLocating(false);
      loadWeather(latitude, longitude);
    }
  };

  const loadWeather = async (lat: number, lon: number) => {
    setLoadingWeather(true);
    try {
      const data = await fetchLiveWeather(lat, lon);
      setWeather(data);
    } catch (e) {
      console.warn('Weather fetch warning:', e);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDraft(null);
    setAnalysisError(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
        setMimeType(file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setDraft(null);
    setAnalysisError(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
        setMimeType(file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image) {
      setAnalysisError('Please select or capture a photo of the issue first.');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setSuccessMessage(null);

    try {
      const result = await analyzeIssueWithAI({
        imageBase64: image,
        mimeType,
        latitude,
        longitude,
        locationName
      });

      if (result.weather) {
        setWeather(result.weather);
      }

      setDraft({
        ...result.complaint,
        image_url: image,
        latitude,
        longitude,
        location_name: locationName,
        weather: result.weather || weather || undefined,
        status: 'Pending',
        created_at: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Analysis error:', err);
      setAnalysisError(err.message || 'Failed to analyze the photo. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!draft) return;
    setSaving(true);
    setAnalysisError(null);

    try {
      const saved = await saveComplaint({
        ...draft,
        image_base64: image || undefined
      });

      onComplaintSaved(saved);
      setSuccessMessage('Your report has been successfully recorded and submitted.');
      
      setTimeout(() => {
        setImage(null);
        setDraft(null);
        setSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      console.error('Save error:', err);
      setAnalysisError(err.message || 'Failed to submit report. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyGrievance = () => {
    if (!draft?.complaint_text) return;
    navigator.clipboard.writeText(draft.complaint_text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleReset = () => {
    setImage(null);
    setDraft(null);
    setAnalysisError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="bg-white dark:bg-[#16111a] border border-pink-100 dark:border-pink-950/70 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header and Location Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-pink-100/80 dark:border-pink-950/60 pb-5">
        <div className="space-y-1">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Report an Issue
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            Upload or snap a photo of damaged roads, waste, broken streetlights, or water leaks to file an official report.
          </p>
        </div>

        {/* Location & Live Weather indicator */}
        <div className="flex items-center gap-3 text-xs bg-pink-50/60 dark:bg-[#201726] px-3.5 py-2 rounded-xl border border-pink-100 dark:border-pink-900/40 self-start lg:self-auto shrink-0">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
            <MapPin className="w-4 h-4 text-pink-500 shrink-0" />
            <span className="truncate max-w-[160px]">{locationName}</span>
          </div>
          {weather && (
            <>
              <div className="h-3.5 w-[1px] bg-pink-200 dark:bg-pink-900/60" />
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <CloudSun className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{weather.temperature}°C • {weather.condition}</span>
              </div>
            </>
          )}
          <button
            onClick={detectLocation}
            disabled={locating}
            title="Refresh location and weather"
            className="text-slate-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors p-0.5 rounded cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${locating ? 'animate-spin text-pink-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Upload / Draft Flow */}
      {!draft ? (
        <div className="space-y-5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {!image ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-pink-200 dark:border-pink-900/50 hover:border-pink-400 dark:hover:border-pink-500 bg-pink-50/30 dark:bg-[#1a1320]/60 hover:bg-pink-50/70 dark:hover:bg-[#201726] rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200"
            >
              <div className="flex flex-col items-center justify-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-pink-100 dark:bg-pink-500/15 border border-pink-200 dark:border-pink-500/30 flex items-center justify-center text-pink-600 dark:text-pink-400 shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                    Click to choose a photo, or drag and drop here
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Supports standard image files (JPG, PNG, WebP)
                  </p>
                </div>

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#241a2c] hover:bg-pink-50 dark:hover:bg-[#2c2036] text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 border border-pink-200/80 dark:border-pink-900/60 shadow-xs transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-pink-500" />
                    <span>Take Photo with Camera</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-pink-100 dark:border-pink-950 max-h-96 flex items-center justify-center">
                <img
                  src={image}
                  alt="Captured Issue"
                  referrerPolicy="no-referrer"
                  className="max-h-96 w-full object-contain"
                />
                <div className="absolute top-3 right-3">
                  <button
                    onClick={handleReset}
                    className="p-2 rounded-xl bg-black/70 hover:bg-rose-600 text-white transition-colors shadow-sm cursor-pointer"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Location Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-pink-500" />
                  Street or Location Description
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. 5th Ave and Main Street, near Central Park"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#201726] border border-pink-100 dark:border-pink-900/50 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          )}

          {analysisError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{analysisError}</span>
            </div>
          )}

          {image && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full py-3.5 px-6 rounded-xl bg-pink-500 hover:bg-pink-600 dark:bg-pink-500 dark:hover:bg-pink-400 active:scale-[0.99] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm shadow-pink-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing Photo & Location Details...</span>
                </>
              ) : (
                <>
                  <span>Analyze Photo & Generate Report</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        /* DRAFT REVIEW SECTION */
        <div className="space-y-6">
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {analysisError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{analysisError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Photo Preview */}
            <div className="lg:col-span-4 space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-pink-100 dark:border-pink-950 aspect-video lg:aspect-square flex items-center justify-center">
                {image && (
                  <img
                    src={image}
                    alt="Reported problem"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-pink-50/50 dark:bg-[#201726] border border-pink-100 dark:border-pink-900/40 text-xs space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-pink-500" />
                  Target Location
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {draft.location_name}
                </p>
              </div>
            </div>

            {/* Right Column: Details & Grievance */}
            <div className="lg:col-span-8 space-y-4">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
                    draft.severity === 'Critical'
                      ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                      : draft.severity === 'High'
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                      : draft.severity === 'Medium'
                      ? 'bg-pink-100 dark:bg-pink-500/20 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30'
                      : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                  }`}
                >
                  Severity: {draft.severity}
                </span>

                {draft.problem_category && (
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-pink-50 dark:bg-[#201726] text-pink-700 dark:text-pink-300 border border-pink-200/80 dark:border-pink-900/40">
                    {draft.problem_category}
                  </span>
                )}

                {draft.department && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-pink-100/60 dark:bg-pink-500/10 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-500/20">
                    <Building2 className="w-3.5 h-3.5 text-pink-500" />
                    <span>{draft.department}</span>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {draft.problem}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  {draft.description}
                </p>
              </div>

              {/* Safety Advice */}
              {draft.citizen_safety_tip && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-amber-900 dark:text-amber-300">Safety Advisory: </strong>
                    <span>{draft.citizen_safety_tip}</span>
                  </div>
                </div>
              )}

              {/* Formal Grievance Letter */}
              {draft.complaint_text && (
                <div className="p-4 rounded-xl bg-pink-50/40 dark:bg-[#110c14] border border-pink-100 dark:border-pink-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <FileText className="w-4 h-4 text-pink-500" />
                      <span>Official Notice Text</span>
                    </div>
                    <button
                      onClick={handleCopyGrievance}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 px-2 py-1 rounded hover:bg-pink-100/50 dark:hover:bg-[#201726] transition-colors cursor-pointer"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-pink-500" />
                          <span className="text-pink-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Text</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-line max-h-36 overflow-y-auto leading-relaxed bg-white dark:bg-[#16111a] p-3 rounded-lg border border-pink-100 dark:border-pink-950">
                    {draft.complaint_text}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-pink-100/80 dark:border-pink-950/60">
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#201726] hover:bg-slate-200 dark:hover:bg-[#2a1e32] text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Discard & Re-take
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 dark:bg-pink-500 dark:hover:bg-pink-400 active:scale-[0.99] text-white font-semibold text-sm flex items-center gap-2 shadow-sm shadow-pink-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Save and Submit the Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
