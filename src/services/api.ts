import { Complaint, ComplaintStatus, AIAnalysisResult, WeatherData, ConfigStatus } from '../types';

export async function fetchConfigStatus(): Promise<ConfigStatus> {
  try {
    const res = await fetch('/api/config-status');
    if (!res.ok) throw new Error('Failed to fetch config status');
    return await res.json();
  } catch (e) {
    return {
      hasGeminiKey: true,
      hasSupabase: false,
      hasTavilyKey: false,
      supabaseConfigured: false
    };
  }
}

export async function fetchLiveWeather(lat: number, lon: number): Promise<WeatherData> {
  try {
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    const data = await res.json();
    if (data.success && data.weather) {
      return data.weather;
    }
    throw new Error(data.error || 'Failed to fetch weather');
  } catch (err) {
    console.warn('Weather fallback:', err);
    return {
      temperature: 21,
      humidity: 55,
      precipitation: 0,
      wind_speed: 8,
      condition: 'Clear sky',
      unit_temp: '°C',
      unit_wind: 'km/h'
    };
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
    const data = await res.json();
    if (data.success && data.address) {
      return data.address;
    }
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch (err) {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

export async function analyzeIssueWithAI(params: {
  imageBase64: string;
  mimeType?: string;
  latitude: number;
  longitude: number;
  locationName?: string;
}): Promise<{
  analysis: AIAnalysisResult;
  weather: WeatherData;
  complaint: Partial<Complaint>;
}> {
  const res = await fetch('/api/analyze-issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64: params.imageBase64,
      mime_type: params.mimeType || 'image/jpeg',
      latitude: params.latitude,
      longitude: params.longitude,
      location_name: params.locationName
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    let msg = errData.error || `Analysis failed with status ${res.status}`;
    // If the error is a raw JSON string like {"error":{"code":503,...}}, extract the human readable message
    if (typeof msg === 'string' && msg.includes('"message"')) {
      try {
        const parsed = JSON.parse(msg);
        if (parsed.error?.message) {
          msg = parsed.error.message;
        }
      } catch (_) {}
    }
    throw new Error(msg);
  }

  return await res.json();
}

export async function fetchComplaints(): Promise<Complaint[]> {
  const res = await fetch('/api/complaints');
  if (!res.ok) throw new Error('Failed to fetch complaints');
  const data = await res.json();
  return data.complaints || [];
}

export async function saveComplaint(complaintData: Partial<Complaint> & { image_base64?: string }): Promise<Complaint> {
  const res = await fetch('/api/complaints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(complaintData)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to save complaint');
  }

  const data = await res.json();
  return data.complaint;
}

export async function updateComplaintStatus(id: string, status: ComplaintStatus): Promise<void> {
  const res = await fetch(`/api/complaints/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });

  if (!res.ok) {
    throw new Error('Failed to update status');
  }
}

export async function deleteComplaint(id: string): Promise<void> {
  const res = await fetch(`/api/complaints/${id}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    throw new Error('Failed to delete complaint');
  }
}

export async function clearAllComplaints(): Promise<void> {
  const res = await fetch('/api/complaints/clear-all', {
    method: 'POST'
  });

  if (!res.ok) {
    throw new Error('Failed to clear complaints');
  }
}
