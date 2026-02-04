# AdPulse AI - Google Ads Auditor

AI-powered Google Ads auditing tool that connects to the Google Ads API, extracts campaign data, and generates optimization recommendations using Gemini AI.

## Prerequisites

- Node.js 18+
- Google Ads API credentials:
  - Developer Token (must be approved)
  - OAuth2 Client ID & Secret
  - Refresh Token
- Gemini API Key

## Quick Start

### 1. Start the Backend Server

```bash
cd server
cp .env.example .env
# Edit .env with your credentials (optional, can be passed via UI)
npm install
npm run dev
```

Server runs at `http://localhost:3001`

### 2. Start the Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### 3. Use the Application

1. Open `http://localhost:5173` in your browser
2. Enter your Google Ads API credentials
3. Click "Fetch Campaign Data" to retrieve last 30 days of data
4. Review the campaign table
5. Click "Generate AI Audit" for optimization recommendations
6. Copy or download the Markdown report

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/token` | POST | Exchange refresh token for access token |
| `/api/google-ads/campaigns` | POST | Fetch campaign data with GAQL |
| `/api/audit/generate` | POST | Generate AI audit from campaign data |
| `/health` | GET | Server health check |

## Architecture

```
adpulse-ai/
├── server/           # Express + TypeScript backend
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Google Ads + Gemini integration
│   │   └── middleware/
│   └── .env.example
└── client/           # Vite + React frontend
    └── src/
        ├── components/
        └── services/
```

## Security Notes

- All API credentials are passed to the backend, never stored in browser
- Rate limiting prevents quota violations (100 req/15min)
- CORS configured for localhost development
- For production, add HTTPS and proper origin restrictions
