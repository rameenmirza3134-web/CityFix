import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser limits for image base64 payloads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Supabase client initialization
let supabase: SupabaseClient | null = null;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('[CityFix AI] Connected to Supabase at:', supabaseUrl);
  } catch (err) {
    console.error('[CityFix AI] Error initializing Supabase client:', err);
  }
} else {
  console.log('[CityFix AI] Supabase credentials not set. Operating in local storage mode with real AI & live weather.');
}

// In-memory / persistent file backup for complaints when Supabase is not connected
const DATA_FILE = path.join(process.cwd(), '.complaints_cache.json');
let localComplaints: any[] = [];

// Load existing complaints from cache or start empty
function loadLocalComplaints() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      // Filter out any older mock seeds with 'cf-seed-'
      localComplaints = Array.isArray(parsed) ? parsed.filter((c: any) => !c.id?.startsWith('cf-seed-')) : [];
    } else {
      localComplaints = [];
    }
  } catch (e) {
    console.warn('Could not read complaints cache, starting empty:', e);
    localComplaints = [];
  }
}

function saveLocalComplaints() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(localComplaints, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving local complaints:', e);
  }
}

loadLocalComplaints();

// Helper: Open-Meteo Weather Fetcher
async function fetchOpenMeteoWeather(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m`;
  const res = await fetch(url, { headers: { 'User-Agent': 'CityFixAI/1.0' } });
  if (!res.ok) throw new Error(`Weather fetch failed with status ${res.status}`);
  const data = await res.json();
  const current = data.current || {};
  
  const weatherCodes: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };

  const code = current.weather_code || 0;
  return {
    temperature: current.temperature_2m ?? 20,
    humidity: current.relative_humidity_2m ?? 60,
    precipitation: current.precipitation ?? 0,
    wind_speed: current.wind_speed_10m ?? 8,
    condition: weatherCodes[code] || 'Normal',
    weather_code: code,
    unit_temp: '°C',
    unit_wind: 'km/h'
  };
}

// Helper: Tavily Web Search
async function fetchTavilyCivicSearch(query: string, apiKey?: string) {
  const key = apiKey || process.env.TAVILY_API_KEY;
  if (!key || key.trim() === '') return null;

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CityFixAI/1.0'
      },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 3
      })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        answer: data.answer || '',
        snippets: (data.results || []).slice(0, 2).map((r: any) => `${r.title}: ${r.content}`)
      };
    }
  } catch (e) {
    console.warn('[Tavily Search Warning]:', e);
  }
  return null;
}

// Helper: Run Python Agent script `agent.py`
function executePythonAgent(payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const agentScriptPath = path.join(process.cwd(), 'agent.py');
    const child = spawn('python3', [agentScriptPath], {
      env: { ...process.env }
    });

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.warn(`[Python Agent Process exited with code ${code}] stderr: ${stderrData}`);
        return reject(new Error(`Python agent error: ${stderrData || 'Exit code ' + code}`));
      }

      try {
        const parsed = JSON.parse(stdoutData.trim());
        if (parsed.error && !parsed.success) {
          return reject(new Error(parsed.error));
        }
        resolve(parsed);
      } catch (err) {
        console.error('Failed to parse Python agent output:', stdoutData);
        reject(new Error('Invalid JSON received from Python Agent'));
      }
    });

    // Write input payload to python stdin
    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

// Helper: Node Fallback Gemini Vision Analysis in case Python environment has issues
async function executeNodeGeminiAgent(payload: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  const weather = payload.weather || await fetchOpenMeteoWeather(payload.latitude, payload.longitude);
  let cleanBase64 = payload.image_base64;
  let mimeType = payload.mime_type || 'image/jpeg';
  if (cleanBase64.includes(',')) {
    const parts = cleanBase64.split(',');
    cleanBase64 = parts[1];
    const match = parts[0].match(/:(.*?);/);
    if (match) mimeType = match[1];
  }

  const prompt = `You are CityFix AI, an expert municipal civil engineer and civic problem reporting agent.
Analyze the attached photo of an urban problem (e.g. pothole, garbage buildup, broken streetlight, water leak, damaged pavement).
Location: ${payload.location_name || 'City Coordinates'} (${payload.latitude}, ${payload.longitude})
Current Weather: Temp ${weather.temperature}°C, Condition ${weather.condition}, Precipitation ${weather.precipitation}mm, Wind ${weather.wind_speed}km/h, Humidity ${weather.humidity}%.

Evaluate how weather affects the hazard (e.g., rain filling potholes, wind blowing trash or loose lines).
Assign severity: Low, Medium, High, or Critical.

Return ONLY a JSON object:
{
  "problem": "concise title",
  "problem_category": "Roads & Pavements" | "Sanitation & Waste" | "Street Lighting & Electrical" | "Water & Sewage" | "Traffic & Signage" | "Public Parks & Trees" | "Other Infrastructure",
  "description": "detailed description of problem and visible damage",
  "severity": "Low" | "Medium" | "High" | "Critical",
  "severity_reason": "why this severity was chosen including weather considerations",
  "recommended_action": "municipal engineering fix",
  "department": "responsible municipal department",
  "citizen_safety_tip": "safety tip for citizens",
  "complaint_text": "formal letter to municipal council"
}`;

  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-3.7-flash'];
  let analysis: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: mimeType
                }
              },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const raw = response.text || '{}';
      analysis = JSON.parse(raw);
      if (analysis && analysis.problem) break;
    } catch (e: any) {
      console.warn(`[Node Gemini] Model ${model} unavailable:`, e.message);
    }
  }

  // Graceful fallback if models return 503 / unavailable
  if (!analysis || !analysis.problem) {
    analysis = {
      problem: 'Reported Civic Problem & Hazard',
      problem_category: 'Sanitation & Waste',
      description: `Reported urban infrastructure issue at ${payload.location_name || 'civic coordinates'}. Inspection required for remediation.`,
      severity: 'Medium',
      severity_reason: `Active urban impediment considering current weather (${weather.condition}, ${weather.temperature}°C).`,
      recommended_action: 'Dispatch inspection team to clear defect and restore public safety.',
      department: 'Department of Public Works',
      citizen_safety_tip: 'Proceed with caution and report further degradation.',
      complaint_text: `To: Department of Public Works\nRe: Urgent Civic Grievance at ${payload.location_name || 'site coordinates'}\n\nNotice is hereby given of infrastructure damage observed at the site during ${weather.condition} weather conditions (${weather.temperature}°C).\n\nRecommended Action: Immediate municipal site clearance.\n\nFiled via CityFix AI Civic Reporter.`
    };
  }

  const complaint = {
    problem: analysis.problem || 'Civic Infrastructure Defect',
    problem_category: analysis.problem_category || 'Other Infrastructure',
    description: analysis.description || 'Observed defect.',
    severity: analysis.severity || 'Medium',
    severity_reason: analysis.severity_reason || '',
    recommended_action: analysis.recommended_action || 'Inspect and repair.',
    department: analysis.department || 'Public Works',
    citizen_safety_tip: analysis.citizen_safety_tip || 'Proceed with caution.',
    complaint_text: analysis.complaint_text || 'Official complaint filing.',
    latitude: payload.latitude,
    longitude: payload.longitude,
    location_name: payload.location_name || `${payload.latitude.toFixed(4)}, ${payload.longitude.toFixed(4)}`,
    weather: weather,
    status: 'Pending',
    tavily_researched: false,
    created_at: new Date().toISOString()
  };

  return {
    success: true,
    analysis,
    weather,
    complaint
  };
}

// ---------------- API ROUTES ----------------

// 1. Health check & configuration status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CityFix AI Civic Engine'
  });
});

app.get('/api/config-status', (req, res) => {
  res.json({
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ''),
    hasSupabase: Boolean(supabase !== null),
    hasTavilyKey: Boolean(process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY.trim() !== ''),
    supabaseUrl: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/https?:\/\//, '').split('.')[0] + '...' : undefined,
    supabaseConfigured: Boolean(supabase !== null)
  });
});

// 2. Weather endpoint (Open-Meteo)
app.get('/api/weather', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 37.7749;
    const lon = parseFloat(req.query.lon as string) || -122.4194;
    const weather = await fetchOpenMeteoWeather(lat, lon);
    res.json({ success: true, weather });
  } catch (error: any) {
    console.error('Weather error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Reverse Geocoding Proxy (OpenStreetMap Nominatim)
app.get('/api/geocode', async (req, res) => {
  try {
    const lat = req.query.lat;
    const lon = req.query.lon;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon are required' });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const geoRes = await fetch(url, {
      headers: { 'User-Agent': 'CityFixAI-ReverseGeocoder/1.0 (contact: support@cityfix.ai)' }
    });

    if (geoRes.ok) {
      const data = await geoRes.json();
      const addr = data.address || {};
      const street = addr.road || addr.pedestrian || addr.street || '';
      const suburb = addr.suburb || addr.neighbourhood || addr.city_district || '';
      const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || '';
      const formatted = [street, suburb, city].filter(Boolean).join(', ') || data.display_name;
      
      return res.json({
        success: true,
        address: formatted || `${lat}, ${lon}`,
        raw: data
      });
    }

    res.json({
      success: true,
      address: `${lat}, ${lon}`
    });
  } catch (err: any) {
    res.json({
      success: true,
      address: `${req.query.lat}, ${req.query.lon}`
    });
  }
});

// 4. Main AI Analysis Route (Runs Python Agent + Open-Meteo + Tavily + Gemini)
app.post('/api/analyze-issue', async (req, res) => {
  try {
    const { image_base64, mime_type, latitude, longitude, location_name } = req.body;

    if (!image_base64) {
      return res.status(400).json({ error: 'Image data is required.' });
    }

    const lat = typeof latitude === 'number' ? latitude : parseFloat(latitude) || 37.7749;
    const lon = typeof longitude === 'number' ? longitude : parseFloat(longitude) || -122.4194;

    const payload = {
      image_base64,
      mime_type: mime_type || 'image/jpeg',
      latitude: lat,
      longitude: lon,
      location_name: location_name || '',
      gemini_key: process.env.GEMINI_API_KEY,
      tavily_key: process.env.TAVILY_API_KEY
    };

    console.log(`[CityFix AI] Running Python AI Agent for location (${lat}, ${lon})...`);

    let result;
    try {
      // Execute Python Agent first as requested
      result = await executePythonAgent(payload);
      console.log('[CityFix AI] Python Agent completed analysis successfully.');
    } catch (pyErr: any) {
      console.warn('[CityFix AI] Python agent execution encountered issue, utilizing Node Gemini pipeline:', pyErr.message);
      result = await executeNodeGeminiAgent(payload);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('[CityFix AI] Analysis pipeline error:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze civic issue with AI agent.',
      success: false
    });
  }
});

// 5. Complaints CRUD (Supabase with pure cloud persistence)

// GET all complaints
app.get('/api/complaints', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[CityFix AI] Supabase query error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, complaints: data || [], source: 'supabase' });
    }

    // Local fallback only when Supabase is not configured in env
    return res.json({
      success: true,
      complaints: localComplaints,
      source: 'local'
    });
  } catch (error: any) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST save complaint
app.post('/api/complaints', async (req, res) => {
  try {
    const complaintData = req.body;
    const tempFileId = crypto.randomUUID();
    
    let finalImageUrl = complaintData.image_url || '';

    // Handle Supabase Storage upload to 'complaint-images' bucket
    if (supabase && complaintData.image_base64 && !finalImageUrl.startsWith('http')) {
      try {
        const base64Data = complaintData.image_base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `${tempFileId}.jpg`;

        // Try creating bucket if not exists (fails silently if already created)
        try {
          await supabase.storage.createBucket('complaint-images', { public: true });
        } catch (_) {}

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('complaint-images')
          .upload(filename, buffer, {
            contentType: complaintData.mime_type || 'image/jpeg',
            upsert: true
          });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('complaint-images')
            .getPublicUrl(filename);
          
          if (publicUrlData?.publicUrl) {
            finalImageUrl = publicUrlData.publicUrl;
          }
        } else if (uploadError) {
          console.warn('[CityFix AI] Supabase storage upload notice:', uploadError.message);
        }
      } catch (storageErr: any) {
        console.warn('[CityFix AI] Storage upload warning:', storageErr?.message);
      }
    }

    // Compose rich description if department or safety notes are available
    let richDescription = complaintData.description || '';
    if (complaintData.department && !richDescription.includes(`Department:`)) {
      richDescription += `\n\nTarget Department: ${complaintData.department}`;
    }
    if (complaintData.citizen_safety_tip && !richDescription.includes(`Safety Tip:`)) {
      richDescription += `\nSafety Advisory: ${complaintData.citizen_safety_tip}`;
    }

    // Exact schema matching user's Supabase complaints table:
    // created_at, problem, description, severity, latitude, longitude, weather, status, image_url
    // (We omit 'id' so Supabase bigint/identity generates the primary key automatically)
    const recordToSave: any = {
      created_at: complaintData.created_at || new Date().toISOString(),
      problem: complaintData.problem || 'Civic Infrastructure Defect',
      description: richDescription,
      severity: complaintData.severity || 'Medium',
      latitude: parseFloat(complaintData.latitude) || 0,
      longitude: parseFloat(complaintData.longitude) || 0,
      weather: typeof complaintData.weather === 'object' ? complaintData.weather : (complaintData.weather || {}),
      status: complaintData.status || 'Pending',
      image_url: finalImageUrl || complaintData.image_base64 || ''
    };

    if (supabase) {
      let { data, error } = await supabase
        .from('complaints')
        .insert([recordToSave])
        .select()
        .single();

      // If error occurs due to weather column datatype (e.g. text vs jsonb), retry with stringified weather
      if (error && error.message && error.message.toLowerCase().includes('weather')) {
        const textRecord = {
          ...recordToSave,
          weather: JSON.stringify(recordToSave.weather)
        };
        const retryResult = await supabase
          .from('complaints')
          .insert([textRecord])
          .select()
          .single();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        console.error('[CityFix AI] Supabase insert error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.status(201).json({
        success: true,
        complaint: data || { id: String(tempFileId), ...recordToSave },
        storedInSupabase: true
      });
    }

    // Local memory fallback only when Supabase is not configured
    const localRecord = { id: tempFileId, ...recordToSave };
    localComplaints.unshift(localRecord);
    saveLocalComplaints();

    res.status(201).json({
      success: true,
      complaint: localRecord,
      storedInSupabase: false
    });
  } catch (error: any) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

// PATCH update status
app.patch('/api/complaints/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'In Review', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('complaints')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[CityFix AI] Supabase status update error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, complaint: data });
    }

    const index = localComplaints.findIndex((c) => c.id === id);
    if (index !== -1) {
      localComplaints[index].status = status;
      saveLocalComplaints();
      return res.json({ success: true, complaint: localComplaints[index] });
    }

    res.json({ success: true, message: 'Status updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message, success: false });
  }
});

// DELETE single complaint
app.delete('/api/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (supabase) {
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[CityFix AI] Supabase delete error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, id });
    }

    localComplaints = localComplaints.filter((c) => c.id !== id);
    saveLocalComplaints();

    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message, success: false });
  }
});

// Clear all complaints
app.post('/api/complaints/clear-all', async (req, res) => {
  try {
    if (supabase) {
      const { error } = await supabase
        .from('complaints')
        .delete()
        .gte('created_at', '1970-01-01');

      if (error) {
        console.error('[CityFix AI] Supabase clear error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, message: 'All complaints cleared from Supabase' });
    }

    localComplaints = [];
    saveLocalComplaints();
    res.json({ success: true, message: 'All complaints cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message, success: false });
  }
});

// ---------------- VITE MIDDLEWARE & SERVER START ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CityFix AI] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
