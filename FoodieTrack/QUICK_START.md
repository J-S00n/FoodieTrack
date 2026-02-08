# FoodieTrack Integration - Quick Reference

## What Was Accomplished

Your frontend and backend are now fully integrated with the following features:

### 1. **Voice Recording & Analysis** (`VoiceRecorder.tsx`)
   - User records audio through the browser
   - Backend sends to ElevenLabs for transcription
   - Gemini analyzes sentiment, intent, and extracts keywords
   - Preferences are auto-extracted and saved to database
   - Results displayed to user with confidence indicators

### 2. **Dietary Preferences Form** (`DietaryForm.tsx`)
   - User selects dietary preferences/restrictions
   - All selections saved to backend database
   - Auto-generates AI-powered food recommendations
   - Shows match score and reasoning for each recommendation

### 3. **User Onboarding** (`ProfileForm.tsx`)
   - Collects comprehensive user profile (diet goals, activity level, cuisines, etc.)
   - Saves to localStorage for immediate use
   - Also saves to backend for AI to consider
   - Database acts as source of truth for recommendations

### 4. **Dashboard** (`Dashboard.tsx`)
   - Displays all user preferences grouped by category
   - Shows stats: total preferences, categories, profile completion
   - Pull-to-refresh capability
   - Good starting point for user to see their profile

---

## File Structure

```
src/
├── services/
│   ├── api.ts                 # Base HTTP client with token injection
│   ├── preferences.ts         # CRUD operations for preferences
│   ├── voice.ts              # Voice recording & analysis
│   └── recommendations.ts    # Food recommendations
├── components/
│   ├── VoiceRecorder.tsx      # Updated with API calls
│   ├── DietaryForm.tsx        # Updated with API calls + recommendations
│   ├── ProfileForm.tsx        # Updated to save to backend
│   ├── Dashboard.tsx          # Updated to display preferences
│   └── ... (other components)
└── etc.

backend/
├── main.py                    # Updated with CORS configuration
├── routes/
│   ├── preferences.py         # GET, POST, PUT, DELETE preferences
│   ├── recommendations.py     # POST for recommendations
│   └── voice.py              # POST audio for analysis
├── services/
│   ├── preference_service.py # Database operations
│   ├── voice_service.py      # ElevenLabs + Gemini integration
│   └── recommendation_service.py # Scoring logic
└── ... (other files)

Configuration Files:
├── .env.example              # Copy to .env.local and configure
└── INTEGRATION_GUIDE.md      # Detailed architecture & extension guide
```

---

## Step-by-Step Testing

### Test 1: User Onboarding → Profile Saved to Database

1. Start frontend: `npm run dev`
2. Start backend: `cd backend && python main.py`
3. Complete Auth0 login
4. Fill out ProfileForm (select diet preferences, activity level, cuisines)
5. Click "Continue"

**Expected:** 
- Form submits successfully
- Page transitions to MainApp
- Preferences saved to backend database

**Check Backend:**
```bash
cd backend
sqlite3 foodie.db "SELECT * FROM preferences LIMIT 10;"
```
You should see rows with source="onboarding"

---

### Test 2: Voice Recording → Preferences Extracted

1. In MainApp, find VoiceRecorder section
2. Click "Start Recording"
3. Say: "I'm allergic to peanuts but I love sushi"
4. Click "Stop Recording"
5. Click "Analyze & Save Preferences"

**Expected:**
- Shows transcription: "I'm allergic to peanuts but I love sushi"
- Shows sentiment: Positive
- Shows keywords: ["peanuts", "sushi"]
- Shows extracted preferences:
  - allergy: peanuts
  - preference: sushi

**Check Backend:**
```bash
sqlite3 foodie.db "SELECT * FROM preferences WHERE category='food';"
```
Should show new entries with source="voice"

---

### Test 3: Dietary Form → Recommendations

1. In MainApp, find DietaryForm section
2. Select some restrictions (e.g., "Gluten-free", "Dairy-free")
3. Select a goal (e.g., "High protein")
4. Click "Get Recommendation"

**Expected:**
- Form data saved to database
- Shows 3 recommended foods with scores
- Each recommendation includes reasoning (e.g., "Gluten-free and high protein")

**Example output:**
```
Top Recommendations For You 🍽️

1. Grilled chicken salad
   Match: 95%
   Reason: Perfect match for gluten-free, dairy-free diet and high protein goal

2. Sushi platter
   Match: 88%
   Reason: Excellent protein source, naturally gluten-free with careful sauce selection

3. Vegetarian pasta
   Match: 65%
   Reason: Meets some dietary needs but dairy alternatives needed for full compliance
```

---

### Test 4: Dashboard → View All Preferences

1. In MainApp, find Dashboard section
2. Click "Refresh Preferences" (if previously empty)

**Expected:**
- Shows all preferences grouped by category
- Displays counts: Total Preferences, Categories
- Shows preferences as tags:
  - diet: vegan, vegetarian, etc.
  - allergy: gluten-free, peanuts, etc.
  - cuisine: italian, chinese, etc.

---

## Debugging Common Issues

### Issue: "Failed to fetch" or CORS error
**Solution:**
1. Make sure backend is running: `curl http://localhost:8000`
2. Check output shows: `{"message": "Hello, user {user_id}!"}`
3. Verify `.env.local` has: `VITE_API_URL=http://localhost:8000`

### Issue: "401 Unauthorized"
**Solution:**
1. Check Auth0 token is being sent
2. Add console.log in auth check:
   ```typescript
   const token = await getAccessTokenSilently();
   console.log("Token:", token);
   ```
3. Make sure Auth0 environment variables are correct in `.env.local`

### Issue: "404 Not Found"
**Solution:**
1. Check route path - backend uses `/preferences/` (with trailing slash)
2. Check HTTP method: GET for list, POST for create, PUT for update, DELETE for delete
3. Backend routes are in:
   - `/preferences/` - preference operations
   - `/voice/analyze` - voice analysis
   - `/recommendations/` - recommendations

### Issue: Preferences not saving
**Solution:**
1. Check backend database exists: `ls -la backend/*.db`
2. Check database has tables: `sqlite3 foodie.db ".tables"`
3. Add logging to backend route to see what's happening

---

## Architecture Learning Points

### 1. Service Layer Pattern
Services abstract HTTP communication:
```typescript
// Components use clean APIs
const prefs = await preferencesService.list(token);

// Service handles all HTTP details
class PreferencesService {
  async list(token) {
    return apiService.request("/preferences/", { method: "GET" }, token);
  }
}
```

**Why:** Easy to test, maintain, and swap implementations

### 2. Token-Based Authentication
Each request includes Auth0 token:
```typescript
const token = await getAccessTokenSilently(); // Get from Auth0
await apiService.request(endpoint, options, token); // Include in request
```

Backend validates:
```python
user_id = Depends(get_current_user_id)  # Extracts from token
```

### 3. Flexible Preference Model
Rather than fixed columns, preferences are:
```typescript
{
  preference_type: "restriction" | "preference" | "allergy" | etc,
  value: string,
  category: string,
  metadata: { source: "voice" | "form" | "onboarding" }
}
```

This allows storing ANY preference type without schema changes.

### 4. Two-Step Form Processing
1. **Save to local state:** Immediate UI feedback
2. **Save to backend:** Enables recommendations and sync

```typescript
// Save locally first
onComplete(profile);

// Save to backend for AI
for (const pref of prefsToSave) {
  await preferencesService.create(pref, token);
}
```

### 5. AI Integration Points
- **Voice → Gemini:** Analyze transcript for sentiment/intent/keywords
- **Recommendations → Gemini:** Score food candidates based on preferences
- **Preferences → ElevenLabs:** Transcribe user speech

---

## Next Steps to Extend

### Add Real Menu Data
```typescript
// src/services/menu.ts
async getFoodItems(restaurantId: string) {
  return apiService.request(`/restaurants/${restaurantId}/menu`, {}, token);
}

// Use in DietaryForm:
const candidates = await menuService.getFoodItems(restaurantId);
```

### Add Preference Categories
```typescript
await preferencesService.create({
  preference_type: "budget",
  value: "$5-15 per meal",
  category: "practical",
  metadata: { source: "manual" }
}, token);
```

### Add User Feedback Loop
```typescript
// After showing recommendation
await apiService.request("/feedback", {
  method: "POST",
  body: JSON.stringify({
    recommendation_id: rec.id,
    liked: boolean,
    notes: string
  })
}, token);
```

### Add Meal Planning
```typescript
async generateMealPlan(days: number, token: string) {
  return apiService.request("/meal-plans", {
    method: "POST",
    body: JSON.stringify({ days })
  }, token);
}
```

---

## Key Files to Study

1. **[src/services/api.ts](src/services/api.ts)** - Base HTTP client with token injection
2. **[src/services/preferences.ts](src/services/preferences.ts)** - Preference CRUD
3. **[src/services/voice.ts](src/services/voice.ts)** - Voice upload & analysis
4. **[backend/main.py](backend/main.py)** - FastAPI setup with CORS
5. **[backend/routes/preferences.py](backend/routes/preferences.py)** - Preference endpoints
6. **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Detailed architecture guide

---

## Common Patterns to Reuse

### Async Form Submission with Loading
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleSubmit = async () => {
  setLoading(true);
  setError(null);
  try {
    const token = await getAccessTokenSilently();
    const result = await someService.doSomething(token);
    // Handle result
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

return (
  <>
    <button disabled={loading}>{loading ? "Loading..." : "Submit"}</button>
    {error && <div style={{color: "red"}}>{error}</div>}
  </>
);
```

### Loading Data on Mount
```typescript
useEffect(() => {
  loadData();
}, []); // Empty deps = run once on mount

const loadData = async () => {
  setLoading(true);
  try {
    const token = await getAccessTokenSilently();
    const data = await someService.list(token);
    setData(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

---

## Configuration

### Environment Variables (.env.local)

```env
# Backend API URL
VITE_API_URL=http://localhost:8000

# Auth0 (if using Auth0 provider)
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
```

### Backend CORS Configuration

Edit `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Or use environment variable:
```bash
export CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
```

---

## Performance Tips

1. **Cache preferences locally:**
   ```typescript
   const cached = localStorage.getItem("preferences");
   const [prefs] = useState(cached ? JSON.parse(cached) : []);
   ```

2. **Debounce recommendation requests:**
   ```typescript
   const debouncedGetRecs = debounce(getRecommendations, 500);
   ```

3. **Batch API calls:**
   ```typescript
   Promise.all([
     preferencesService.list(token),
     recommendationsService.getRecommendations(candidates, 3, token)
   ]);
   ```

---

**Happy coding! Check INTEGRATION_GUIDE.md for deeper learning on architecture decisions and patterns.**
