# CityFix AI 🏙️

> **AI-Powered Civic Issue & Community Infrastructure Reporter**

CityFix AI is an intelligent civic reporting platform that empowers citizens and municipalities to identify, document, and resolve community infrastructure issues. By uploading a photo of a problem—such as potholes, streetlight failures, waste accumulation, or water line leaks—the system uses Google Gemini AI to analyze the defect, assess severity, route it to the responsible municipal department, and draft an official notice.

---

## ✨ Features

- 📸 **AI Defect Detection & Classification**: Upload or take a photo to automatically identify issues (Potholes, Road Damage, Waste/Sanitation, Streetlights, Water Leaks, Public Hazards) powered by Google Gemini (`gemini-2.5-flash`).
- ⚡ **Automated Department Routing**: Directs reports to the appropriate agency (e.g., Department of Public Works, Department of Sanitation, Water & Sewer Department, Department of Transportation).
- 🚨 **Severity & Safety Assessment**: Evaluates severity (`Critical`, `High`, `Medium`, `Low`) and generates actionable citizen safety advisories.
- 🌤️ **Live Environmental Weather Integration**: Automatically captures real-time temperature, wind speed, and meteorological conditions via Open-Meteo to provide environmental context for road and utility repairs.
- 📍 **Geolocation Detection**: Automatically extracts or prompts for GPS coordinates and street descriptions.
- 📜 **Official Municipal Notice Generation**: Formulates structured, ready-to-file civic grievance letters with one-click clipboard copying.
- 📊 **Status Lifecycle Tracking**: Track reports across their resolution cycle (`Pending` ➔ `In Progress` ➔ `Resolved`) with status filtering.
- 🌗 **Light & Dark Mode**: Seamless theme switching with persistent user preferences.
- 💾 **Dual Storage Architecture**: Supports direct connection to **Supabase** (PostgreSQL + Image Storage) or runs with zero-config local persistent storage out of the box.

---

## 🛠️ Tech Stack

### Client
- **Framework**: [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Build**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/)

### Server & APIs
- **Backend**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- **AI Engine**: [Google Gen AI SDK (`@google/genai`)](https://www.npmjs.com/package/@google/genai)
- **Weather API**: [Open-Meteo](https://open-meteo.com/) (Real-time meteorological metrics)
- **Database / Storage**: [Supabase](https://supabase.com/) (Optional) or local JSON storage

---

## 📁 Project Structure

```
├── index.html                   # Application entry point
├── metadata.json                # App metadata and permissions
├── package.json                 # Dependencies and build scripts
├── server.ts                    # Express API server & Gemini AI backend
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration with Tailwind CSS plugin
├── .env.example                 # Environment variable template
└── src/
    ├── main.tsx                 # React DOM mount point
    ├── App.tsx                  # Primary application container
    ├── index.css                # Global styles & Tailwind entry
    ├── types.ts                 # TypeScript interfaces & types
    ├── components/
    │   ├── SimpleReporter.tsx   # Photo upload, camera capture & AI analysis
    │   ├── ComplaintCard.tsx    # Responsive issue card component
    │   └── ComplaintDetailsModal.tsx # Detailed view & official notice reader
    └── services/
        └── api.ts               # Client-side API service layer
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** or **yarn** or **pnpm**
- **Google Gemini API Key**: [Get an API key here](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/cityfix-ai.git
   cd cityfix-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

   Open `.env` and fill in your keys:
   ```env
   # Required for AI photo analysis
   GEMINI_API_KEY="your_google_gemini_api_key"

   # Optional: Supabase configuration (if cloud database is desired)
   SUPABASE_URL=""
   SUPABASE_ANON_KEY=""

   # Optional: Tavily API key
   TAVILY_API_KEY=""
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

---

## 📦 Building for Production

To create a production-ready build:

```bash
npm run build
```

To run the production server:

```bash
npm start
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze-issue` | Analyzes an uploaded photo with Gemini 2.5 Flash, extracts defects, department, severity, and drafts formal notice |
| `GET` | `/api/weather?lat={lat}&lon={lon}` | Fetches live weather conditions for given GPS coordinates |
| `GET` | `/api/complaints` | Retrieves all submitted civic issue reports |
| `POST` | `/api/complaints` | Submits and stores a new civic report |
| `PATCH` | `/api/complaints/:id` | Updates the status (`Pending`, `In Progress`, `Resolved`) of a report |
| `DELETE` | `/api/complaints/:id` | Deletes a single report |
| `DELETE` | `/api/complaints` | Clears all reports |
| `GET` | `/api/health` | Health check endpoint |

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.
