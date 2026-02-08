# FoodieTrack Audio-to-ElevenLabs Setup Guide

## API Keys Required

### 1. ElevenLabs API Key (for Speech-to-Text)
- Go to: https://elevenlabs.io/sign-up
- Create a free account
- Go to Settings → API Keys
- Copy your API key
- Save it as: `ELEVENLABS_API_KEY`

### 2. Google Gemini API Key (for Analysis)
- Go to: https://ai.google.dev/
- Click "Get API Key"
- Select your Google Cloud project (or create new)
- Copy the API key
- Save it as: `GEMINI_API_KEY`

### 3. Auth0 Configuration (already set up)
- Domain: Your Auth0 domain
- Client ID: Your application ID
- Audience: Your API identifier

## .env File Setup

Create a `.env` file in your `backend/` folder with these variables:

```
# ElevenLabs Speech-to-Text API
ELEVENLABS_API_KEY=sk_1234567890abcdefghijk

# Google Gemini AI API
GEMINI_API_KEY=AIzaSyABC...

# Auth0 Configuration
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://api.foodietrack.com

# CORS - Allow frontend to call backend
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Database
DATABASE_URL=sqlite+aiosqlite:///./foodietrack.db
```

## File Structure & Implementation

Current implementation includes:

✅ Frontend:
- src/services/api.ts - Base HTTP client
- src/services/voice.ts - Voice service layer
- src/components/VoiceRecorder.tsx - UI component

✅ Backend:
- backend/routes/voice.py - API endpoint
- backend/services/voice_service.py - ElevenLabs integration
- backend/schemas/voice.py - Data validation models

## Audio Upload Flow

1. User records audio in browser (via MediaRecorder)
2. Audio compressed to Blob (webm format)
3. Sent as multipart/form-data to /voice/analyze
4. Backend sends to ElevenLabs API
5. ElevenLabs returns transcript
6. Optionally: Send to Gemini for analysis
7. Extract preferences & save to database
8. Return results to frontend

## Testing the Flow

Once you've added the API keys to `.env`:

1. Restart backend (Ctrl+C, then `python main.py`)
2. Go to http://localhost:5173
3. Log in with Auth0
4. Navigate to MainApp
5. Find VoiceRecorder section
6. Click "Start Recording"
7. Say: "I'm allergic to peanuts but I love sushi"
8. Click "Stop Recording" 
9. Click "Analyze & Save Preferences"
10. See results appear with transcription!

## Troubleshooting

### "ELEVENLABS_API_KEY is not configured"
- Check .env file exists in backend/
- Add ELEVENLABS_API_KEY=your_key
- Restart backend with `python main.py`

### "GEMINI_API_KEY is not configured"  
- Check .env file exists in backend/
- Add GEMINI_API_KEY=your_key
- Restart backend

### "Invalid ElevenLabs API key"
- Copy the correct API key from elevenlabs.io
- Make sure it starts with "sk_"
- Verify no extra spaces or special characters

### "ElevenLabs rate limit exceeded"
- You've made too many requests
- Free tier limited to ~100 per month
- Wait 24 hours or upgrade account

### "Invalid audio format"
- Browser should record as webm
- If not working, check browser compatibility
- Try Chrome, Edge, or Firefox

## Code Walk-through

The complete flow is implemented in three layers:

1. **Frontend Service** (src/services/voice.ts)
   - Handles FormData creation
   - Injects Auth0 token
   - Makes HTTP POST request

2. **Backend Route** (backend/routes/voice.py)
   - Receives multipart upload
   - Validates audio file
   - Calls service layer

3. **Backend Service** (backend/services/voice_service.py)
   - Sends audio to ElevenLabs
   - Handles ElevenLabs errors
   - Optionally calls Gemini
   - Extracts preferences

## What Happens When You Send Audio

```
Browser User → Records audio → Blob created
                        ↓
         FormData with audio + use_gemini=true
                        ↓
         HTTP POST to /voice/analyze
         Authorization: Bearer <auth0_token>
                        ↓
         FastAPI receives multipart form-data
         Extracts: audio (Blob), use_gemini (bool), user_id (from token)
                        ↓
         Validates audio (size, format)
                        ↓
         Calls voice_service.transcribe_audio()
                        ↓
         HTTP POST to ElevenLabs API
         Headers: xi-api-key: <ELEVENLABS_API_KEY>
         Body: audio file
                        ↓
         ElevenLabs returns: {"text": "I'm allergic to peanuts..."}
                        ↓
         If use_gemini=true:
           HTTP POST to Gemini API
           Body: transcript text
           Returns: sentiment, intent, keywords in JSON
                        ↓
         Extract preferences from keywords and transcript
                        ↓
         Save to SQLite database
         Link to user_id from Auth0 token
                        ↓
         Return JSON response to frontend
         - transcript
         - sentiment
         - keywords
         - extracted_preferences
                        ↓
         Frontend displays results
         Shows extracted preferences to user
```

## Next Steps

1. Add ELEVENLABS_API_KEY to .env
2. Add GEMINI_API_KEY to .env
3. Restart backend
4. Test the VoiceRecorder component
5. Check database: `sqlite3 foodietrack.db "SELECT * FROM preferences;"`
6. Verify preferences were saved with source="voice"
