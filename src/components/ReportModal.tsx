import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  CloudSun,
  Sparkles,
  AlertTriangle,
  Building,
  Wrench,
  ShieldAlert,
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Search,
  Database
} from 'lucide-react';
import { Complaint, SeverityLevel, WeatherData, ProblemCategory } from '../types';
import { fetchLiveWeather, reverseGeocode, analyzeIssueWithAI, saveComplaint } from '../services/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage: string | null;
  initialMimeType?: string;
  onComplaintSaved: (newComplaint: Complaint) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  initialImage,
  initialMimeType = 'image/jpeg',
  onComplaintSaved
}) => {
  // Wizard state: 'setup' | 'analyzing' | 'review' | 'submitting' | 'done'
  const [step, setStep] = useState<'setup' | 'analyzing' | 'review' | 'submitting' | 'done'>('setup');
  
  // Input state
  const [image, setImage] = useState<string | null>(initialImage);
  const [mimeType, setMimeType] = useState<string>(initialMimeType);
  const [latitude, setLatitude] = useState<number>(37.7749);
  const [longitude, setLongitude] = useState<number>(-122.4194);
  const [locationName, setLocationName] = useState<string>('Civic Center, San Francisco, CA');
  const [locating, setLocating] = useState<boolean>(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);

  // Analysis state
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Generated Fields (Editable in review step)
  const [problem, setProblem] = useState<string>('');
  const [problemCategory, setProblemCategory] = useState<ProblemCategory>('Roads & Pavements');
  const [description, setDescription] = useState<string>('');
  const [severity, setSeverity] = useState<SeverityLevel>('Medium');
  const [severityReason, setSeverityReason] = useState<string>('');
  const [recommendedAction, setRecommendedAction] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [citizenSafetyTip, setCitizenSafetyTip] = useState<string>('');
  const [complaintText, setComplaintText] = useState<string>('');
  const [tavilyResearched, setTavilyResearched] = useState<boolean>(false);

  // Saved complaint reference
  const [savedComplaint, setSavedComplaint] = useState<Complaint | null>(null);

  // Sync initial image
  useEffect(() => {
    if (initialImage) {
      setImage(initialImage);
      setStep('setup');
      setAnalysisError(null);
      detectUserLocation();
    }
  }, [initialImage]);

  // Fetch weather when coordinates change
  useEffect(() => {
    if (latitude && longitude) {
      loadWeather(latitude, longitude);
    }
  }, [latitude, longitude]);

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        try {
          const address = await reverseGeocode(lat, lon);
          setLocationName(address);
        } catch (e) {
          setLocationName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        setLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const loadWeather = async (lat: number, lon: number) => {
    setLoadingWeather(true);
    try {
      const data = await fetchLiveWeather(lat, lon);
      setWeather(data);
    } catch (e) {
      console.warn('Weather fetch error:', e);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (!image) return;
    setStep('analyzing');
    setAnalysisError(null);

    try {
      setAnalysisProgress('1/4 Connecting to Python Civic Agent...');
      await new Promise((r) => setTimeout(r, 400));

      setAnalysisProgress('2/4 Syncing live Open-Meteo weather factors...');
      await new Promise((r) => setTimeout(r, 400));

      setAnalysisProgress('3/4 Invoking Gemini Multimodal Vision & Tavily Research...');
      
      const res = await analyzeIssueWithAI({
        imageBase64: image,
        mimeType: mimeType,
        latitude,
        longitude,
        locationName
      });

      setAnalysisProgress('4/4 Structuring complaint & severity calculation...');
      await new Promise((r) => setTimeout(r, 300));

      const { analysis, weather: liveWeather } = res;
      setProblem(analysis.problem || 'Observed Urban Issue');
      setProblemCategory(analysis.problem_category || 'Other Infrastructure');
      setDescription(analysis.description || '');
      setSeverity(analysis.severity || 'Medium');
      setSeverityReason(analysis.severity_reason || '');
      setRecommendedAction(analysis.recommended_action || 'Inspect and rectify.');
      setDepartment(analysis.department || 'Public Works Department');
      setCitizenSafetyTip(analysis.citizen_safety_tip || 'Use caution in vicinity.');
      setComplaintText(analysis.complaint_text || '');
      if (liveWeather) setWeather(liveWeather);
      setTavilyResearched(Boolean((res as any).complaint?.tavily_researched));

      setStep('review');
    } catch (err: any) {
      console.error('Agent analysis error:', err);
      setAnalysisError(err.message || 'AI agent could not analyze this image.');
      setStep('setup');
    }
  };

  const handleSubmitToSupabase = async () => {
    setStep('submitting');
    try {
      const newRecord = await saveComplaint({
        problem,
        problem_category: problemCategory,
        description,
        severity,
        severity_reason: severityReason,
        recommended_action: recommendedAction,
        department,
        citizen_safety_tip: citizenSafetyTip,
        complaint_text: complaintText,
        latitude,
        longitude,
        location_name: locationName,
        weather: weather || {
          temperature: 20,
          humidity: 60,
          precipitation: 0,
          wind_speed: 8,
          condition: 'Clear sky'
        },
        status: 'Pending',
        image_base64: image || undefined,
        tavily_researched: tavilyResearched
      });

      setSavedComplaint(newRecord);
      onComplaintSaved(newRecord);
      setStep('done');
    } catch (err: any) {
      console.error('Save error:', err);
      alert(`Failed to save complaint: ${err.message}`);
      setStep('review');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#111111] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#111111]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                CityFix AI Civic Reporter
                {tavilyResearched && (
                  <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase">
                    Tavily Researched
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 font-mono text-[11px]">
                {step === 'setup' && 'Step 1 of 3: Verify Location & Weather'}
                {step === 'analyzing' && 'Step 2 of 3: AI Agent Processing'}
                {step === 'review' && 'Step 3 of 3: Review & Submit Complaint'}
                {step === 'done' && 'Complaint Successfully Logged!'}
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

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: SETUP & LOCATION VERIFICATION */}
          {step === 'setup' && (
            <div className="space-y-5">
              {analysisError && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <p className="font-bold">Analysis Failed</p>
                    <p className="text-[11px] mt-0.5 text-red-400">{analysisError}</p>
                  </div>
                </div>
              )}

              {/* Image Preview & Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Photo Preview */}
                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center group">
                  {image ? (
                    <img
                      src={image}
                      alt="Civic Issue Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-slate-500 text-xs font-mono">No image uploaded</div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-[10px] font-mono text-slate-300 border border-slate-800">
                    Uploaded Photo
                  </div>
                </div>

                {/* Location & Weather Context Box */}
                <div className="space-y-3">
                  {/* Location Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                        Incident Location
                      </label>
                      <button
                        type="button"
                        onClick={detectUserLocation}
                        disabled={locating}
                        className="text-[11px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
                        {locating ? 'Locating...' : 'Use GPS'}
                      </button>
                    </div>

                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g. 5th Ave & Market St"
                      className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#1a1a1a] text-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                    />
                    <p className="text-[10px] font-mono text-slate-500">
                      Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </p>
                  </div>

                  {/* Open-Meteo Weather Snapshot */}
                  <div className="p-3 rounded-xl bg-[#161616] border border-slate-800 text-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                        <CloudSun className="w-3.5 h-3.5 text-blue-400" />
                        Open-Meteo Weather
                      </span>
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        Live Data
                      </span>
                    </div>

                    {loadingWeather ? (
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 py-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> Fetching live conditions...
                      </div>
                    ) : weather ? (
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                        <div className="bg-[#1a1a1a] p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase">Temp</span>
                          <span className="font-bold text-white text-xs">
                            {weather.temperature}°C
                          </span>
                        </div>
                        <div className="bg-[#1a1a1a] p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase">Sky</span>
                          <span className="font-bold text-white text-xs truncate block">
                            {weather.condition}
                          </span>
                        </div>
                        <div className="bg-[#1a1a1a] p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase">Rain/Wind</span>
                          <span className="font-bold text-white text-xs">
                            {weather.precipitation}mm | {weather.wind_speed}kph
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-slate-500">Weather data unavailable</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartAnalysis}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all hover:scale-[1.02]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze with AI Agent</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ANALYZING STATE WITH ANIMATED STAGES */}
          {step === 'analyzing' && (
            <div className="py-12 px-4 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-r-blue-400 border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-2 rounded-full bg-[#161616] flex items-center justify-center text-blue-400 shadow-xl border border-slate-800">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-white">
                  AI Agent Analyzing Issue
                </h3>
                <p className="text-xs font-mono font-medium text-blue-400 animate-pulse">
                  {analysisProgress || 'Inspecting defect visual features and environmental risks...'}
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  Gemini Vision + Open-Meteo Weather + Tavily Civic Knowledge
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW AND EDIT GENERATED COMPLAINT */}
          {step === 'review' && (
            <div className="space-y-4">
              {/* Severity & Category Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Severity Meter */}
                <div className="p-3 rounded-xl bg-[#161616] border border-slate-800">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Risk Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[#1a1a1a] border border-slate-800 text-white outline-none"
                  >
                    <option value="Low">Low - Minor defect</option>
                    <option value="Medium">Medium - Moderate hazard</option>
                    <option value="High">High - Severe risk</option>
                    <option value="Critical">Critical - Immediate threat</option>
                  </select>
                  {severityReason && (
                    <p className="text-[10px] font-mono text-slate-400 mt-1.5 leading-snug">
                      {severityReason}
                    </p>
                  )}
                </div>

                {/* Problem Category */}
                <div className="p-3 rounded-xl bg-[#161616] border border-slate-800">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={problemCategory}
                    onChange={(e) => setProblemCategory(e.target.value as ProblemCategory)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[#1a1a1a] border border-slate-800 text-white outline-none"
                  >
                    <option value="Roads & Pavements">Roads & Pavements</option>
                    <option value="Sanitation & Waste">Sanitation & Waste</option>
                    <option value="Street Lighting & Electrical">Street Lighting & Electrical</option>
                    <option value="Water & Sewage">Water & Sewage</option>
                    <option value="Traffic & Signage">Traffic & Signage</option>
                    <option value="Public Parks & Trees">Public Parks & Trees</option>
                    <option value="Other Infrastructure">Other Infrastructure</option>
                  </select>
                </div>

                {/* Responsible Department */}
                <div className="p-3 rounded-xl bg-[#161616] border border-slate-800">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Building className="w-3 h-3 text-blue-400" />
                    Target Authority
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-[#1a1a1a] border border-slate-800 text-white outline-none"
                  />
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1 font-mono">
                    Problem Title
                  </label>
                  <input
                    type="text"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#1a1a1a] text-white text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1 font-mono">
                    AI Visual Analysis & Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#1a1a1a] text-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Recommendations & Safety Tips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#161616] border border-slate-800">
                  <span className="text-xs font-mono font-semibold text-blue-400 flex items-center gap-1.5 mb-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    Recommended Municipal Fix
                  </span>
                  <input
                    type="text"
                    value={recommendedAction}
                    onChange={(e) => setRecommendedAction(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#1a1a1a] border border-slate-800 rounded-lg text-slate-200 outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#161616] border border-slate-800">
                  <span className="text-xs font-mono font-semibold text-yellow-500 flex items-center gap-1.5 mb-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Citizen Safety Guidance
                  </span>
                  <input
                    type="text"
                    value={citizenSafetyTip}
                    onChange={(e) => setCitizenSafetyTip(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#1a1a1a] border border-slate-800 rounded-lg text-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* Formal Grievance Letter */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1 flex items-center gap-1.5 font-mono">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Formal Civic Complaint Letter (Drafted by AI)
                </label>
                <textarea
                  rows={4}
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#1a1a1a] text-slate-200 text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none leading-relaxed"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep('setup')}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Back to Setup
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSubmitToSupabase}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all hover:scale-[1.02]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>File Complaint to Supabase</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUBMITTING STATE */}
          {step === 'submitting' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
              <p className="text-xs font-mono text-slate-300">
                Filing structured complaint to Supabase database & storage...
              </p>
            </div>
          )}

          {/* DONE STATE */}
          {step === 'done' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  Complaint Filed Successfully!
                </h3>
                <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
                  Your complaint for <strong className="text-slate-200">{problem}</strong> has been logged to the database with active status <strong className="text-yellow-500">Pending Review</strong>.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all"
                >
                  View in Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
