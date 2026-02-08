# Complete Audio-to-ElevenLabs Implementation Guide

## Quick Start Checklist

- [ ] Add `ELEVENLABS_API_KEY` to `backend/.env`
- [ ] Add `GEMINI_API_KEY` to `backend/.env`
- [ ] Restart backend: `Ctrl+C` then `python main.py`
- [ ] Visit http://localhost:5173 in browser
- [ ] Log in with Auth0
- [ ] Go to VoiceRecorder section
- [ ] Click "Start Recording" → Speak → "Stop Recording"
- [ ] Click "Analyze & Save Preferences"
- [ ] See transcript and extracted preferences!

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ BROWSER (User Interface)                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Action: Click "Start Recording"                           │
│        ↓                                                        │
│  Browser MediaRecorder captures microphone audio                │
│  Records audio chunks in real-time                              │
│        ↓                                                        │
│  User speaks: "I'm allergic to peanuts but love sushi"         │
│        ↓                                                        │
│  Click "Stop Recording"                                        │
│        ↓                                                        │
│  Audio chunks combined into Blob {type: "audio/webm", ...}     │
│  Size: ~125 KB (highly compressed)                              │
│        ↓                                                        │
│  VoiceRecorder Component (React)                                │
│  - Gets Auth0 access token                                      │
│  - Calls voiceService.analyzeAudio(audioBlob, true, token)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        HTTP POST /voice/analyze (multipart/form-data)
        Headers: Authorization: Bearer <JWT_TOKEN>
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND API (FastAPI on localhost:8000)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Endpoint: POST /voice/analyze                                  │
│  (backend/routes/voice.py)                                      │
│        ↓                                                        │
│  FastAPI parses multipart form-data:                            │
│  - audio field: 125 KB binary blob (audio/webm)                 │
│  - use_gemini field: true (boolean)                             │
│  - user_id: extracted from JWT token                            │
│        ↓                                                        │
│  Validation:                                                    │
│  - Check content-type (must be audio/*like webm, m4a, mp3, etc) │
│  - Check file size (max 25 MB)                                  │
│  - Check not empty                                              │
│        ↓                                                        │
│  Call: process_voice(audio_bytes, content_type, use_gemini)    │
│  (backend/services/voice_service.py)                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        ┌─────────────────┬─────────────────┐
        ↓                 ↓                 ↓
   ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
   │ ElevenLabs  │  │  Gemini AI   │  │   SQLite DB  │
   │ (STT)       │  │  (Analysis)  │  │  (Preferences│
   └─────────────┘  └──────────────┘  └──────────────┘
       ↓                  ↓                  ↓
   Transcribe        Analyze text        Save prefs
   ("I'm allergic..") (sentiment...)     (user_id,
                                         pref_type,
                                         value)

1. TRANSCRIBE (ElevenLabs)
   ──────────────────────────────────
   
   Request:
   POST https://api.elevenlabs.io/v1/speech-to-text
   Headers: xi-api-key: sk_xxxxx
   Body: multipart/form-data
     - file: 125 KB audio blob
     - model_id: "scribe_v2"
   
   Response (200 OK):
   {
     "text": "I'm allergic to peanuts but I love sushi",
     "language_code": "en"
   }
   
   ← 500 bytes instead of 125 KB!

2. ANALYZE (Gemini API - Optional)
   ──────────────────────────────────
   
   Request:
   POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
   Headers: Authorization: Bearer AIzaSy_xxxxx
   Body: {
     "contents": {
       "parts": [{
         "text": "Analyze: 'I'm allergic to peanuts but I love sushi'. Return JSON with sentiment, emotion, intent, keywords..."
       }]
     },
     "generationConfig": {
       "response_mime_type": "application/json",
       "response_schema": VoiceInsights
     }
   }
   
   Response (200 OK):
   {
     "transcript": "I'm allergic to peanuts but I love sushi",
     "sentiment": "positive",
     "emotion": "calm",
     "intent": "dietary_preference_statement",
     "keywords": ["allergic", "peanuts", "sushi", "love"],
     "summary": "User has peanut allergy, enjoys sushi"
   }

3. EXTRACT & SAVE (Backend Logic)
   ──────────────────────────────────
   
   Python code extracts preferences from:
   - transcript analysis (keywords)
   - pattern matching ("allergic to X", "love X")
   - Gemini's intent/keywords fields
   
   Creates preference objects:
   [
     {
       "preference_type": "allergy",
       "value": "peanuts",
       "category": "food",
       "metadata": {"source": "voice"}
     },
     {
       "preference_type": "preference",
       "value": "sushi",
       "category": "food",
       "metadata": {"source": "voice"}
     }
   ]
   
   For each preference:
   INSERT INTO preferences
   (user_id, preference_type, value, category, metadata)
   VALUES
   ('auth0|1234567890abcdef', 'allergy', 'peanuts', 'food', '{"source":"voice"}')

4. RETURN RESPONSE
   ──────────────────────────────────
   
   FastAPI returns HTTP 200 OK:
   {
     "insights": {
       "transcript": "I'm allergic to peanuts but I love sushi",
       "sentiment": "positive",
       "emotion": "calm",
       "intent": "dietary_preference_statement",
       "keywords": ["allergic", "peanuts", "sushi"]
     },
     "extracted_preferences": [
       {
         "preference_type": "allergy",
         "value": "peanuts",
         "category": "food",
         "metadata": {"source": "voice"}
       },
       {
         "preference_type": "preference",
         "value": "sushi",
         "category": "food",
         "metadata": {"source": "voice"}
       }
     ],
     "message": "Analysis complete. 2 preferences saved."
   }

5. DISPLAY RESULTS (Frontend)
   ──────────────────────────────────
   
   VoiceRecorder component receives response
   
   setAnalysis(result) updates React state
   
   Component renders:
   
   ┌─────────────────────────────────────┐
   │ Analysis Results                    │
   ├─────────────────────────────────────┤
   │ Transcript:                         │
   │ I'm allergic to peanuts but I love  │
   │ sushi                               │
   │                                     │
   │ Sentiment: positive                 │
   │ Emotion: calm                       │
   │ Intent: dietary_preference_statement│
   │                                     │
   │ Keywords:                           │
   │ allergic, peanuts, sushi            │
   │                                     │
   │ Extracted Preferences:              │
   │ • allergy: peanuts                  │
   │ • preference: sushi                 │
   └─────────────────────────────────────┘
```

---

## Code Implementation Details

### Frontend: VoiceRecorder.tsx

```typescript
// 1. User clicks "Start Recording"
const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  // Browser asks user: "Allow access to microphone?"
  
  const recorder = new MediaRecorder(stream);
  // MediaRecorder object handles audio compression
  
  recorder.ondataavailable = (e) => {
    chunksRef.current.push(e.data);
    // Accumulates audio chunks (250ms each)
  };
  
  recorder.onstop = () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    // Combines all chunks into single Blob
    audioChunkRef.current = blob;
  };
  
  recorder.start();
};

// 2. User clicks "Stop Recording"
const stopRecording = () => {
  recorderRef.current?.stop();
};

// 3. User clicks "Analyze & Save Preferences"
const handleUploadAudio = async () => {
  // Get auth0 token (proves the user is authenticated)
  const token = await getAccessTokenSilently();
  
  // Send to voice service
  const result = await voiceService.analyzeAudio(
    audioChunkRef.current,  // The Blob
    true,                   // Use Gemini
    token                   // Auth0 JWT
  );
  
  // Display results
  setAnalysis(result);
};
```

### Frontend Service: src/services/voice.ts

```typescript
export class VoiceService {
  async analyzeAudio(
    audioBlob: Blob,      // 125 KB webm blob
    useGemini: boolean,   // true
    token: string         // JWT from Auth0
  ): Promise<VoiceAnalysisResponse> {
    
    // Step 1: Create FormData (needed for binary files)
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");
    formData.append("use_gemini", String(useGemini));
    
    // Step 2: Send to backend
    return apiService.requestMultipart<VoiceAnalysisResponse>(
      "/voice/analyze",  // Endpoint
      formData,          // Binary audio + form fields
      token              // Auth0 token
    );
  }
}
```

### Base API Service: src/services/api.ts

```typescript
async requestMultipart<T>(
  endpoint: string,
  formData: FormData,
  token?: string
): Promise<T> {
  const url = `http://localhost:8000${endpoint}`;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    // Token tells backend: "This is authenticated user XYZ"
  }
  
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,  // FormData automatically sets content-type
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return await response.json();
}
```

### Backend Route: backend/routes/voice.py

```python
@router.post("/analyze")
async def analyze_voice(
    user_id: Annotated[str, Depends(get_current_user_id)],
    # ↑ Extracted from JWT token automatically
    
    audio: Annotated[UploadFile, File(...)],
    # ↑ FastAPI parses multipart form-data, gives us UploadFile
    
    use_gemini: Annotated[bool, Form(...)] = True,
    # ↑ FastAPI extracts from form fields
    
    session: AsyncSession = Depends(get_session),
):
    # Step 1: Read binary audio data
    body = await audio.read()  # Get bytes
    content_type = audio.content_type or ""  # "audio/webm"
    
    # Step 2: Validate
    validate_audio_input(content_type, len(body))
    
    # Step 3: Process
    result = await process_voice(
        audio_bytes=body,
        content_type=content_type,
        use_gemini=use_gemini
    )
    
    # Step 4: Extract preferences
    prefs = extract_preferences(
        transcript=result.get("transcript"),
        intent=result.get("intent"),
        keywords=result.get("keywords")
    )
    
    # Step 5: Save to database
    for p in prefs:
        await create_preference(session, user_id, PreferenceCreate(**p))
    
    # Step 6: Return response
    return VoiceAnalysisResponse(**result)
```

### Backend Service: backend/services/voice_service.py

```python
async def transcribe_audio(
    audio_bytes: bytes,       # 125,000 bytes
    content_type: str         # "audio/webm"
) -> tuple[str, str | None]:
    """Send to ElevenLabs for transcription"""
    
    api_key = os.getenv("ELEVENLABS_API_KEY")
    # Gets: sk_xxxxxxxxxxxxx
    
    # Prepare request
    files = {"file": ("audio.webm", audio_bytes, content_type)}
    data = {"model_id": "scribe_v2"}
    
    # Send to ElevenLabs
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.elevenlabs.io/v1/speech-to-text",
            headers={"xi-api-key": api_key, "Accept": "application/json"},
            files=files,
            data=data,
        )
    
    # Handle errors
    if response.status_code == 401:
        raise TranscriptionError("Invalid ElevenLabs API key")
    if response.status_code == 429:
        raise TranscriptionError("ElevenLabs rate limit exceeded")
    if response.status_code >= 400:
        raise TranscriptionError(f"Error {response.status_code}")
    
    # Parse response
    body = response.json()
    text = body.get("text", "").strip()
    language_code = body.get("language_code")
    
    return text, language_code


async def analyze_with_gemini(transcript: str) -> VoiceInsights:
    """Send transcript to Gemini for analysis"""
    
    api_key = os.getenv("GEMINI_API_KEY")
    # Gets: AIzaSyxxxxx
    
    client = genai.Client(api_key=api_key)
    
    prompt = f"""Analyze this food-related speech:
    - sentiment: positive/neutral/negative
    - emotion: happy/sad/frustrated/calm/etc
    - intent: food order/feedback/dietary request/etc
    - keywords: important food/diet words
    
    Transcript: "{transcript}"
    
    Return JSON with these fields."""
    
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=VoiceInsights.model_json_schema(),
        ),
    )
    
    return VoiceInsights.model_validate_json(response.text)


async def process_voice(
    audio_bytes: bytes,
    content_type: str,
    use_gemini: bool = True
) -> dict:
    """Complete pipeline: transcribe + analyze"""
    
    # Step 1: Transcribe with ElevenLabs
    transcript, language_code = await transcribe_audio(audio_bytes, content_type)
    
    # Step 2: Optionally analyze with Gemini
    if use_gemini:
        insights = await analyze_with_gemini(transcript)
        return {
            "transcript": insights.transcript,
            "sentiment": insights.sentiment,
            "emotion": insights.emotion,
            "intent": insights.intent,
            "keywords": insights.keywords,
            "summary": insights.summary,
            "language_code": language_code,
        }
    
    # No analysis, return just transcript
    return {
        "transcript": transcript,
        "sentiment": "neutral",
        "emotion": "neutral",
        "intent": "unknown",
        "keywords": [],
        "summary": None,
        "language_code": language_code,
    }
```

---

## Environment Variables Required

Create `backend/.env` with:

```bash
# ElevenLabs (Speech-to-Text)
ELEVENLABS_API_KEY=sk_...your...api...key...

# Google Gemini (AI Analysis)
GEMINI_API_KEY=AIzaSy...your...api...key...

# Auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://api.foodietrack.com

# CORS
CORS_ORIGINS=http://localhost:5173

# Database
DATABASE_URL=sqlite+aiosqlite:///./foodietrack.db
```

---

## Testing the Flow

**Scenario: User Records Food Preference**

```bash
# Terminal 1: Start Frontend
cd c:\Users\unknown\Documents\cxchacks\FoodieTrack
npm run dev
# ↑ Runs on http://localhost:5173

# Terminal 2: Start Backend
cd c:\Users\unknown\Documents\cxchacks\FoodieTrack\backend
python main.py
# ↑ Runs on http://localhost:8000

# Browser:
1. Open http://localhost:5173
2. Log in with Auth0
3. Navigate to MainApp
4. Scroll to VoiceRecorder section
5. Click "Start Recording"
6. Speak: "I'm allergic to peanuts but I love sushi"
7. Click "Stop Recording"
8. Click "Analyze & Save Preferences"

# Expected Results:
- Transcript appears: "I'm allergic to peanuts but I love sushi"
- Sentiment: positive
- Keywords: ["allergic", "peanuts", "sushi", "love"]
- Extracted preferences saved:
  • allergy: peanuts
  • preference: sushi

# Database verification:
sqlite3 foodietrack.db
sqlite> SELECT * FROM preferences WHERE category='food';
# Should see rows with values "peanuts" and "sushi"
```

---

## Error Reference

| Error | Cause | Solution |
|-------|-------|----------|
| "ELEVENLABS_API_KEY is not configured" | Missing env var | Add to .env: `ELEVENLABS_API_KEY=sk_...` |
| "Invalid ElevenLabs API key" | Wrong key | Check key starts with `sk_` |
| "ElevenLabs rate limit exceeded" | Too many requests | Free tier ~100/month, wait or upgrade |
| "Invalid audio format" | Unsupported audio type | Browser should use webm; check browser |
| "GEMINI_API_KEY is not configured" | Missing env var | Add to .env: `GEMINI_API_KEY=AIzaSy...` |
| "Gemini returned empty response" | API error | Check Gemini API is enabled in Google Cloud |
| "Failed to access microphone" | Browser permission denied | Grant microphone permission |
| "Audio file too large" | Audio > 25 MB | Record shorter clips |

---

## Data Flow Summary

```
Audio Blob (125 KB)
    ↓ FormData multipart
HTTP POST /voice/analyze (with Auth0 token)
    ↓
FastAPI parses multipart
    ↓
Validates audio (size, format)
    ↓
Sends to ElevenLabs API
    ↓
ElevenLabs returns transcript (500 bytes)
    ↓
Sends transcript to Gemini API (optional)
    ↓
Gemini returns analysis JSON (500 bytes)
    ↓
Extract preferences from transcript + keywords
    ↓
Save to SQLite database (linked to user_id)
    ↓
Return response to frontend (1-2 KB)
    ↓
Frontend displays transcript + analysis + preferences
    ↓
User sees extracted food preferences saved!
```

---

## Next Steps

1. **Get API Keys:**
   - ElevenLabs: https://elevenlabs.io/
   - Gemini: https://ai.google.dev/

2. **Add to .env file:**
   ```
   ELEVENLABS_API_KEY=your_key_here
   GEMINI_API_KEY=your_key_here
   ```

3. **Restart Backend:**
   ```bash
   Ctrl+C (to stop current server)
   python main.py (to restart)
   ```

4. **Test Voice Recording in Browser**

5. **Verify Preferences Saved:**
   ```bash
   sqlite3 foodietrack.db "SELECT * FROM preferences LIMIT 10;"
   ```

6. **Extend with More Features:**
   - Add meal planning
   - Connect to restaurant APIs
   - Implement recipe suggestions
   - Add shopping list generation
