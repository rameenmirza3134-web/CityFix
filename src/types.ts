export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus = 'Pending' | 'In Review' | 'In Progress' | 'Resolved';

export type ProblemCategory = 
  | 'Roads & Pavements'
  | 'Sanitation & Waste'
  | 'Street Lighting & Electrical'
  | 'Water & Sewage'
  | 'Traffic & Signage'
  | 'Public Parks & Trees'
  | 'Other Infrastructure';

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  condition: string;
  weather_code?: number;
  unit_temp?: string;
  unit_wind?: string;
}

export interface AIAnalysisResult {
  problem: string;
  problem_category?: ProblemCategory;
  description: string;
  severity: SeverityLevel;
  severity_reason?: string;
  recommended_action: string;
  department: string;
  citizen_safety_tip?: string;
  complaint_text: string;
}

export interface Complaint {
  id: string;
  problem: string;
  description: string;
  severity: SeverityLevel;
  latitude: number;
  longitude: number;
  location_name?: string;
  weather: WeatherData | string;
  status: ComplaintStatus;
  image_url: string;
  created_at: string;
  // Extra fields for rich civic management
  problem_category?: ProblemCategory;
  recommended_action?: string;
  department?: string;
  citizen_safety_tip?: string;
  complaint_text?: string;
  severity_reason?: string;
  tavily_researched?: boolean;
}

export interface ComplaintStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  high_or_critical: number;
}

export interface ConfigStatus {
  hasGeminiKey: boolean;
  hasSupabase: boolean;
  hasTavilyKey: boolean;
  supabaseUrl?: string;
  supabaseConfigured: boolean;
}
