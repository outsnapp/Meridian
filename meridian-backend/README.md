# MERIDIAN Backend

Always-on Pharma Market Intelligence System - FastAPI Backend

## Features

- 📥 Data ingestion from Serper News API and OpenFDA
- 🤖 AI-powered classification using OpenAI GPT-4
- 💾 SQLite database for persistent storage
- 🎭 Demo mode with simulated pharma intelligence events
- 🔄 RESTful API for frontend integration
- 🛡️ CORS enabled for Next.js frontend

## Setup

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)

### Installation

1. Navigate to the backend directory:
```bash
cd meridian-backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Set up environment variables:
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your API keys:
# OPENAI_API_KEY=sk-your-actual-key
# SERPER_API_KEY=your-actual-key
```

### Running the Server

Start the development server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

API documentation (Swagger UI): `http://localhost:8000/docs`

## API Endpoints

### POST /simulate
Inject demo pharma intelligence events (no API keys required)
```bash
curl -X POST http://localhost:8000/simulate
```

### GET /events
Retrieve all events (supports filtering)
```bash
# All events
curl http://localhost:8000/events

# Filter by role
curl http://localhost:8000/events?role=Strategy

# Filter by tags
curl http://localhost:8000/events?tags=biosimilar
```

### POST /ingest/live
Fetch real data from Serper and OpenFDA (requires API keys)
```bash
curl -X POST http://localhost:8000/ingest/live
```

### POST /process
Process raw data with OpenAI LLM (requires OpenAI API key)
```bash
curl -X POST http://localhost:8000/process
```

### DELETE /reset
Clear all database records
```bash
curl -X DELETE http://localhost:8000/reset
```

## Quick Demo Workflow

For hackathon demonstration without API keys:

1. Start the server: `uvicorn main:app --reload`
2. Inject demo events: `POST /simulate`
3. View events: `GET /events`
4. Frontend can now fetch and display events

## Database

- **Engine**: SQLite
- **File**: `meridian.db` (auto-created on first run)
- **Tables**: `raw_sources`, `events`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for LLM processing | For live processing |
| `SERPER_API_KEY` | Serper API key for news ingestion | For live ingestion |

## Project Structure

```
meridian-backend/
├── main.py              # FastAPI app and routes
├── database.py          # Database configuration
├── models.py            # SQLAlchemy ORM models
├── services/
│   ├── ingestion.py     # External data fetching
│   ├── llm_engine.py    # OpenAI processing
│   └── simulator.py     # Demo event generation
├── requirements.txt     # Python dependencies
└── .env                 # Environment variables
```

## Development

The backend is designed to work seamlessly with or without external API keys:

- **With API keys**: Full live data ingestion and AI processing
- **Without API keys**: Demo mode using simulated events

This makes it ideal for hackathon demonstrations where internet connectivity or API quotas might be limited.

## Error Handling

All endpoints include comprehensive error handling:
- Failed API calls return empty results (graceful degradation)
- OpenAI failures fall back to default classification
- All errors are logged for debugging
- No crashes on external service failures

## License

Built for hackathon demonstration - MERIDIAN Project 2024
