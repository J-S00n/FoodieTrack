# Complete Audio-to-ElevenLabs Flow Diagram

## End-to-End Visual

```
╔════════════════════════════════════════════════════════════════════════════╗
║                         USER EXPERIENCE FLOW                              ║
╚════════════════════════════════════════════════════════════════════════════╝

     ┌──────────────┐
     │ User opens  │
     │ browser at  │
     │localhost:   │
     │   5173      │
     └──────┬───────┘
            │
            ▼
     ┌──────────────────┐
     │ Log in with      │
     │    Auth0         │
     │                  │
     │ Browser stores:  │
     │ JWT access_token │
     └──────┬───────────┘
            │
            ▼
     ┌──────────────────────┐
     │ Navigate to          │
     │ MainApp              │
     │                      │
     │ See VoiceRecorder    │
     │ component            │
     └──────┬───────────────┘
            │
            ▼
     ┌───────────────────────┐
     │ Click "Start          │
     │ Recording"            │
     │                       │
     │ Browser requests:     │
     │ getUserMedia(audio)   │
     │                       │
     │ ↓ User grants        │
     │   microphone access  │
     │                       │
     │ MediaRecorder object  │
     │ created               │
     └──────┬────────────────┘
            │
            ▼ Recording...
     ┌──────────────────┐
     │ User speaks:     │
     │                  │
     │ "I'm allergic to │
     │ peanuts but I    │
     │ love sushi"      │
     │                  │
     │ Duration: ~5s    │
     └──────┬───────────┘
            │
            ▼
     ┌──────────────────┐
     │ Click "Stop      │
     │ Recording"       │
     │                  │
     │ Audio chunks     │
     │ combined into    │
     │ Blob             │
     │                  │
     │ Size: ~125 KB    │
     │ Type: webm       │
     └──────┬───────────┘
            │
            ▼
     ┌──────────────────────────────┐
     │ Click "Analyze & Save        │
     │ Preferences"                 │
     │                              │
     │ onClick handler triggered:   │
     │                              │
     │ 1. getAccessTokenSilently()  │
     │    → "eyJhbGc..."            │
     │                              │
     │ 2. voiceService.analyzeAudio(║
     │      audioBlob,              │
     │      true,                   │
     │      token)                  │
     └──────┬───────────────────────┘
            │
            │ FormData created
            │ - audio: 125 KB blob
            │ - use_gemini: "true"
            │
            ▼
     ┌────────────────────────────────┐
     │ HTTP REQUEST SENT               │
     │                                 │
     │ POST http://localhost:8000/     │
     │         voice/analyze           │
     │                                 │
     │ Headers:                        │
     │  Content-Type:                  │
     │    multipart/form-data          │
     │  Authorization:                 │
     │    Bearer eyJhbGc...            │
     │                                 │
     │ Body:                           │
     │  ----MultipartBoundary---       │
     │  Content-Disposition: audio     │
     │  [125 KB binary data...]        │
     │  ----MultipartBoundary---       │
     │  Content-Disposition: use_gemini│
     │  true                           │
     │  ----MultipartBoundary---       │
     │                                 │
     │ Loading... spinning indicator   │
     └─────────────┬────────────────────┘
                   │
                   ▼ Network delay ~1-2s
```

---

## Backend Processing Flow

```
╔════════════════════════════════════════════════════════════════════════════╗
║              BACKEND PROCESSING (FastAPI Server)                          ║
╚════════════════════════════════════════════════════════════════════════════╝

     ┌───────────────────────────────────┐
     │ HTTP request arrives at           │
     │ POST /voice/analyze               │
     │                                   │
     │ FastAPI extracts:                 │
     │ - audio: UploadFile (125 KB)      │
     │ - use_gemini: True                │
     │ - user_id: "auth0|1234567..."     │
     │   (from JWT token)                │
     └─────────────┬─────────────────────┘
                   │
                   ▼
     ┌───────────────────────────────────┐
     │ VALIDATION                        │
     │                                   │
     │ validate_audio_input()            │
     │                                   │
     │ ✓ type check:                     │
     │   "audio/webm" → OK               │
     │ ✓ size check:                     │
     │   125 KB < 25 MB → OK             │
     │ ✓ non-empty check:                │
     │   125 KB > 0 → OK                 │
     │                                   │
     │ Result: All validation passed     │
     └─────────────┬─────────────────────┘
                   │
                   ▼
     ┌───────────────────────────────────────┐
     │ process_voice()                       │
     │                                       │
     │ Start TRANSCRIPTION pipeline...       │
     └─────────────┬───────────────────────┬─┘
                   │                       │
                   ▼                       ▼
        ┌────────────────────┐  ┌───────────────────┐
        │  ELEVENLABS API    │  │   GEMINI API      │
        │  (if use_gemini)   │  │  (if use_gemini)  │
        └────────────────────┘  └───────────────────┘


1️⃣  ELEVENLABS TRANSCRIPTION
    ─────────────────────────────────────

     ┌──────────────────────────────────┐
     │ Prepare request for ElevenLabs   │
     │                                  │
     │ POST https://api.elevenlabs.io/  │
     │        v1/speech-to-text         │
     │                                  │
     │ Headers:                         │
     │  xi-api-key: sk_35abc...         │
     │  Accept: application/json        │
     │                                  │
     │ Body:                            │
     │  file: 125 KB audio/webm         │
     │  model_id: scribe_v2             │
     └────────────┬─────────────────────┘
                  │
       ~3-5 seconds (network + processing)
                  │
                  ▼
     ┌──────────────────────────────────┐
     │ ElevenLabs Response              │
     │                                  │
     │ Status: 200 OK                   │
     │                                  │
     │ {                                │
     │  "text": "I'm allergic to        │
     │   peanuts but I love sushi",     │
     │  "language_code": "en"           │
     │ }                                │
     │                                  │
     │ Size: ~500 bytes                 │
     └────────────┬─────────────────────┘
                  │
         transcript = "I'm allergic..."
                  │
                  ▼
     ┌──────────────────────────────────┐
     │ Check: use_gemini = True?        │
     └────────┬──────────────────┬──────┘
              │ YES              │ NO
              ▼                  ▼
        Continue...        Return minimal
                          (no analysis)


2️⃣  GEMINI ANALYSIS (Optional)
    ─────────────────────────────────────

     ┌──────────────────────────────────────┐
     │ Prepare Gemini request               │
     │                                      │
     │ POST generativelanguage.googleapis   │
     │        .com/v1beta/models/           │
     │        gemini-2.0-flash:             │
     │        generateContent               │
     │                                      │
     │ Headers:                             │
     │  Authorization: Bearer AIzaSy...     │
     │                                      │
     │ Body:                                │
     │  prompt: "Analyze this speech for    │
     │   sentiment, emotion, intent,        │
     │   keywords... [detailed prompt]"     │
     │                                      │
     │  response_mime_type: "application/   │
     │                      json"           │
     │  response_schema: VoiceInsights      │
     └───────────────┬──────────────────────┘
                     │
        ~2-3 seconds (API processing)
                     │
                     ▼
     ┌──────────────────────────────────────┐
     │ Gemini Response (JSON)               │
     │                                      │
     │ {                                    │
     │   "transcript": "I'm allergic to     │
     │    peanuts but I love sushi",        │
     │   "sentiment": "positive",           │
     │   "emotion": "calm",                 │
     │   "intent": "dietary_preference",    │
     │   "keywords": [                      │
     │     "allergic",                      │
     │     "peanuts",                       │
     │     "sushi",                         │
     │     "love"                           │
     │   ],                                 │
     │   "summary": "User is allergic to    │
     │    peanuts, enjoys sushi"            │
     │ }                                    │
     │                                      │
     │ Size: ~700 bytes                     │
     └───────────────┬──────────────────────┘
                     │
                     ▼
     ┌──────────────────────────────────────┐
     │ COMBINE RESULTS                      │
     │                                      │
     │ result = {                           │
     │   transcript: "I'm allergic...",     │
     │   sentiment: "positive",             │
     │   emotion: "calm",                   │
     │   intent: "dietary_preference",      │
     │   keywords: [...],                   │
     │   summary: "...",                    │
     │   language_code: "en"                │
     │ }                                    │
     └───────────────┬──────────────────────┘
                     │
                     ▼

3️⃣  EXTRACT PREFERENCES
    ─────────────────────────────────────

     ┌──────────────────────────────────────┐
     │ extract_preferences(                 │
     │   transcript,                        │
     │   intent,                            │
     │   keywords                           │
     │ )                                    │
     │                                      │
     │ Python pattern matching:             │
     │                                      │
     │ 1. Check keywords: "allergic"        │
     │    ✓ Found in transcript             │
     │    → Create "allergy" preference     │
     │                                      │
     │ 2. Check keywords: "peanuts"         │
     │    ✓ Found in transcript             │
     │    ✓ Near "allergic" word            │
     │    → Create "allergy: peanuts"       │
     │                                      │
     │ 3. Check keywords: "sushi"           │
     │    ✓ Found in transcript             │
     │    ✓ Near "love" word                │
     │    → Create "preference: sushi"      │
     │                                      │
     │ Result:                              │
     │ [                                    │
     │   {                                  │
     │     "preference_type": "allergy",    │
     │     "value": "peanuts",              │
     │     "category": "food",              │
     │     "metadata": {"source": "voice"}  │
     │   },                                 │
     │   {                                  │
     │     "preference_type": "preference", │
     │     "value": "sushi",                │
     │     "category": "food",              │
     │     "metadata": {"source": "voice"}  │
     │   }                                  │
     │ ]                                    │
     └───────────────┬──────────────────────┘
                     │
                     ▼

4️⃣  SAVE TO DATABASE
    ─────────────────────────────────────

     ┌──────────────────────────────────────┐
     │ for each preference:                 │
     │   create_preference(                 │
     │     session,        # DB connection  │
     │     user_id,        # "auth0|1234"   │
     │     pref_data       # preference obj │
     │   )                                  │
     │                                      │
     │ Preference 1: allergy: peanuts       │
     │   ↓                                  │
     │   INSERT INTO preferences            │
     │   VALUES (                           │
     │     user_id="auth0|1234567",         │
     │     preference_type="allergy",       │
     │     value="peanuts",                 │
     │     category="food",                 │
     │     metadata='{"source":"voice"}'    │
     │   )                                  │
     │   ✓ Row 1 inserted                   │
     │                                      │
     │ Preference 2: preference: sushi      │
     │   ↓                                  │
     │   INSERT INTO preferences            │
     │   VALUES (                           │
     │     user_id="auth0|1234567",         │
     │     preference_type="preference",    │
     │     value="sushi",                   │
     │     category="food",                 │
     │     metadata='{"source":"voice"}'    │
     │   )                                  │
     │   ✓ Row 2 inserted                   │
     │                                      │
     │ Database confirmed:                  │
     │ SELECT * FROM preferences WHERE      │
     │  user_id="auth0|1234567"             │
     │ LIMIT 2;                             │
     │                                      │
     │ Result:                              │
     │ id | user_id | type | value | cat   │
     │ ---|---------|------|-------|-------│
     │ 17 | auth0.. | aller| peanut | food│
     │ 18 | auth0.. | pref | sushi | food │
     └───────────────┬──────────────────────┘
                     │
                     ▼
     ┌──────────────────────────────────────┐
     │ RETURN RESPONSE TO FRONTEND          │
     │                                      │
     │ HTTP 200 OK                          │
     │ Content-Type: application/json       │
     │                                      │
     │ {                                    │
     │   "insights": {                      │
     │     "transcript": "I'm allergic ...",│
     │     "sentiment": "positive",         │
     │     "emotion": "calm",               │
     │     "intent": "dietary_preference",  │
     │     "keywords": ["allergic",         │
     │                  "peanuts",          │
     │                  "sushi"]            │
     │   },                                 │
     │   "extracted_preferences": [         │
     │     {                                │
     │       "preference_type": "allergy",  │
     │       "value": "peanuts",            │
     │       "category": "food"             │
     │     },                               │
     │     {                                │
     │       "preference_type":             │
     │       "preference",                  │
     │       "value": "sushi",              │
     │       "category": "food"             │
     │     }                                │
     │   ],                                 │
     │   "message": "Analysis complete.     │
     │    2 preferences saved."             │
     │ }                                    │
     │                                      │
     │ Size: ~1.5 KB                        │
     └──────────────┬───────────────────────┘
                    │
              ~100ms DB time
                    │
```

---

## Frontend Displays Results

```
     ┌───────────────────────────────────┐
     │ HTTP response received            │
     │ Status: 200 OK                    │
     │                                   │
     │ JavaScript parses JSON:           │
     │ const result = await response     │
     │   .json()                         │
     │                                   │
     │ Result contains:                  │
     │ ✓ insights.transcript             │
     │ ✓ insights.sentiment              │
     │ ✓ insights.emotion                │
     │ ✓ keywords array                  │
     │ ✓ extracted_preferences array     │
     └─────────────┬─────────────────────┘
                   │
                   ▼
     ┌───────────────────────────────────┐
     │ React setState called:            │
     │ setAnalysis(result)               │
     │                                   │
     │ Updates component state with      │
     │ response data                     │
     └─────────────┬─────────────────────┘
                   │
                   ▼
     ┌───────────────────────────────────┐
     │ Component re-renders              │
     │                                   │
     │ render() uses analysis state:     │
     │ {analysis && (                    │
     │   <div>                           │
     │     <h4>Analysis Results</h4>     │
     │     <p>Transcript: {              │
     │       analysis.insights.transcript│
     │     }</p>                         │
     │     <p>Sentiment: {               │
     │       analysis.insights.sentiment │
     │     }</p>                         │
     │     <p>Keywords: {                │
     │       analysis.insights.keywords  │
     │       .join(", ")                 │
     │     }</p>                         │
     │     <ul>                          │
     │       {analysis                   │
     │        .extracted_preferences     │
     │        .map(pref => (             │
     │         <li>                      │
     │           {pref.preference_type}: │
     │           {pref.value}            │
     │         </li>                     │
     │        ))                         │
     │       }                           │
     │     </ul>                         │
     │   </div>                          │
     │ )}                                │
     └─────────────┬─────────────────────┘
                   │
                   ▼
     ┌─────────────────────────────────────────┐
     │ BROWSER DISPLAYS RESULTS:               │
     │                                         │
     │ ┌───────────────────────────────────┐   │
     │ │ Analysis Results             🎤  │   │
     │ ├───────────────────────────────────┤   │
     │ │                                   │   │
     │ │ Transcript:                       │   │
     │ │ I'm allergic to peanuts but I love   │
     │ │ sushi                             │   │
     │ │                                   │   │
     │ │ Sentiment: positive               │   │
     │ │ Emotion: calm                     │   │
     │ │ Intent: dietary_preference        │   │
     │ │ Keywords: allergic, peanuts, sushi   │
     │ │                                   │   │
     │ │ Extracted Preferences:            │   │
     │ │ • allergy: peanuts                │   │
     │ │ • preference: sushi               │   │
     │ │                                   │   │
     │ └───────────────────────────────────┘   │
     │                                         │
     │ ✅ SUCCESS!                             │
     │                                         │
     │ Preferences saved to database and       │
     │ will be used for recommendations!       │
     └─────────────────────────────────────────┘
```

---

## Timeline

```
T+0s:    User clicks "Start Recording"
T+5s:    User finishes speaking, clicks "Stop Recording"
T+6s:    User clicks "Analyze & Save Preferences"
T+7s:    HTTP request starts
T+8s:    Request arrives at backend
T+8.5s:  Validation complete
T+9s:    ElevenLabs request sent (beginning)
T+12s:   ElevenLabs response received (transcript ready)
T+12.5s: Gemini request sent (beginning)
T+14.5s: Gemini response received (analysis complete)
T+14.7s: Preferences extracted
T+14.8s: Preferences saved to database
T+14.9s: Response sent to frontend
T+16s:   Frontend receives response
T+16.1s: Component re-renders
T+16.2s: Results displayed to user
─────────────────────────────────
Total: ~16 seconds from start to visible results
```

---

## Data Size Progression

```
Original Audio Stream
  16 kHz sample rate × 16-bit depth × 5 seconds
  = 16,000 × 2 bytes × 5 = 1.6 MB
                              │
                              ▼ Browser compresses
                           to WebM
                           ~125 KB
                              │
                              ▼ ElevenLabs transcribes
                           to text
                           ~500 bytes
                              │
                              ▼ Gemini analyzes
                           text + metadata
                           ~700 bytes
                              │
                              ▼ Combined response
                           to frontend
                           ~1.5 KB
                              │
                              ▼ Saved to database
                           as preference record
                           ~500 bytes per pref × 2
                           = 1 KB total
```

---

## Key Takeaways

1. **Audio is heavily compressed** (16x smaller using webm)
2. **ElevenLabs does the heavy lifting** (speech recognition)
3. **Gemini adds intelligence** (understanding intent)
4. **Preferences extracted automatically** (pattern matching + AI)
5. **Everything secured by Auth0 tokens** (user-specific data)
6. **Results saved permanently** (SQLite database)
7. **Total process ~16 seconds** (for 5-second speech)

---

**Now you understand the complete end-to-end flow! 🎉**

See the other guides for implementation details:
- `AUDIO_SETUP_GUIDE.md` - Getting API keys
- `AUDIO_TO_ELEVENLABS_IMPLEMENTATION.md` - Code details
- `AUDIO_QUICK_REFERENCE.md` - Quick lookup
