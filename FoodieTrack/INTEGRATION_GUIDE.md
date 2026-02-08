# FoodieTrack Frontend-Backend Integration Guide

This guide explains how the frontend and backend are connected, the key concepts, and how to extend the integration.

## Overview

Your FoodieTrack application now has a complete frontend-backend integration where:

1. **Frontend (React + TypeScript)** sends user input to the backend
2. **Backend (FastAPI + Python)** processes that data using AI (ElevenLabs for voice, Gemini for analysis)
3. **Results** are returned and displayed in the frontend

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         BROWSER                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │               React Components                          │ │
│  │  - VoiceRecorder                                        │ │
│  │  - DietaryForm                                          │ │
│  │  - ProfileForm                                          │ │
│  │  - Dashboard                                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓ (fetch / HTTP)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Service Layer (src/services/)                 │ │
│  │  - api.ts (base HTTP client)                           │ │
│  │  - preferences.ts (CRUD preferences)                   │ │
│  │  - voice.ts (voice analysis)                           │ │
│  │  - recommendations.ts (get recommendations)             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ (CORS-enabled)
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              API Routes (backend/routes/)               │ │
│  │  - /preferences/ (CRUD operations)                      │ │
│  │  - /voice/analyze (transcription + analysis)           │ │
│  │  - /recommendations/ (AI scoring)                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Services (backend/services/)                    │ │
│  │  - preference_service (database operations)             │ │
│  │  - voice_service (ElevenLabs + Gemini API calls)       │ │
│  │  - recommendation_service (Gemini scoring)              │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │      External AI Services                              │ │
│  │  - ElevenLabs (speech-to-text)                         │ │
│  │  - Google Gemini (analysis & recommendations)           │ │
│  │  - SQLite Database (preference storage)                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. Service Layer Pattern

The frontend organizes API communication through **service classes**. Each service handles one domain:

```typescript
// src/services/preferences.ts
class PreferencesService {
  async create(data, token) { /* ... */ }
  async list(token) { /* ... */ }
  async update(id, data, token) { /* ... */ }
}
```

**Why?** This keeps networking logic separate from components, making testing easier and code reusable.

### 2. Authentication Flow

Each request includes an **Auth0 access token**:

```typescript
const token = await getAccessTokenSilently(); // Get token from Auth0
await apiService.request("/preferences/", options, token); // Include in request
```

The backend validates this token before processing:
```python
user_id: str = Depends(get_current_user_id)  # Extracts user from token
```

### 3. Preference Data Model

Preferences are stored as flexible objects with:
- `preference_type`: What kind of preference (e.g., "restriction", "preference", "allergy")
- `value`: The actual preference value (e.g., "gluten-free")
- `category`: Grouping category (e.g., "allergy", "diet", "cuisine")
- `metadata`: Additional context (e.g., `{"source": "voice"}`)

This flexible approach lets you store any type of preference and track its origin.

### 4. AI Processing Flow

#### Voice Analysis
```
1. User records audio in VoiceRecorder component
2. Frontend uploads blob to /voice/analyze
3. Backend:
   a. Sends to ElevenLabs for transcription
   b. Sends transcript to Gemini for sentiment/intent/keywords
   c. Extracts preferences from keywords
   d. Saves preferences to database
4. Frontend displays results to user
```

#### Recommendations
```
1. User submits food candidates in DietaryForm
2. Frontend fetches user's stored preferences
3. Backend:
   a. Gets all user preferences from database
   b. Sends each candidate + preferences to Gemini
   c. Gemini scores each candidate (0-1)
   d. Returns top-k recommendations with reasoning
4. Frontend displays ranked recommendations
```

## Component Integration Details

### VoiceRecorder Component

**What it does:**
- Records audio using browser's MediaRecorder API
- Sends audio to `/voice/analyze` endpoint
- Displays transcription and extracted preferences

**Key code:**
```typescript
const result = await voiceService.analyzeAudio(
  audioBlob,
  true,  // use Gemini
  token
);
```

**Backend processes this by:**
1. Transcribing with ElevenLabs
2. Analyzing with Gemini
3. Extracting preferences from the analysis
4. Auto-saving to database

### DietaryForm Component

**What it does:**
- Collects dietary preferences via checkbox/radio inputs
- Saves all selections to database as preferences
- Gets AI-powered food recommendations

**Processing flow:**
```typescript
// 1. Convert form data to preference objects
const prefsToSave = preferences.map(p => ({
  preference_type: "preference",
  value: p,
  category: "diet",
  metadata: { source: "form" }
}));

// 2. Save each preference to database
for (const pref of prefsToSave) {
  await preferencesService.create(pref, token);
}

// 3. Get recommendations based on stored preferences
const recs = await recommendationsService.getRecommendations(
  candidates,
  topK,
  token
);
```

The backend's recommendation service:
1. Fetches all user preferences
2. Uses Gemini to score each food item
3. Returns scores + reasoning

### ProfileForm Component

**What it does:**
- Collects user's initial profile (diet goals, activity level, etc.)
- Saves to localStorage (for immediate use)
- Also saves to database for AI to use

**Key concept:** Double storage
```typescript
// Save to localStorage for instant access
localStorage.setItem(key, JSON.stringify(profile));

// Also save to database for recommendations
await preferencesService.create(pref, token);
```

### Dashboard Component

**What it does:**
- Displays all user preferences grouped by category
- Shows statistics (total preferences, categories)
- Auto-loads on component mount

**Pattern:**
```typescript
useEffect(() => {
  loadPreferences();
}, []); // Empty dependency array = run once on mount
```

## How to Extend the Integration

### Add a New AI Feature

**Example: Add nutritional analysis**

1. **Create backend service:**
```python
# backend/services/nutrition_service.py
async def analyze_nutrition(foods: list[str], user_prefs) -> dict:
    # Call Gemini to analyze nutritional content
    prompt = f"Analyze nutrition of {foods} considering {user_prefs}"
    return await gemini_client.generate_content(prompt)
```

2. **Create backend route:**
```python
# backend/routes/nutrition.py
@router.post("/analyze")
async def analyze_nutrition(
    data: NutritionRequest,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session)
):
    prefs = await get_user_preferences(session, user_id)
    result = await analyze_nutrition(data.foods, prefs)
    return result
```

3. **Create frontend service:**
```typescript
// src/services/nutrition.ts
export class NutritionService {
  async analyzeNutrition(foods: string[], token: string) {
    return apiService.request("/nutrition/analyze", {
      method: "POST",
      body: JSON.stringify({ foods })
    }, token);
  }
}
```

4. **Use in component:**
```typescript
const result = await nutritionService.analyzeNutrition(foods, token);
setAnalysis(result);
```

### Add a New Preference Type

Just create a new preference object with `preference_type`:

```typescript
await preferencesService.create({
  preference_type: "budget_constraint",
  value: "$5-10 per meal",
  category: "practical",
  metadata: { source: "user_input" }
}, token);
```

The backend stores it as-is, and Gemini can consider it in recommendations.

### Connect to a New Data Source

Example: Load menu items from an API:

```typescript
// src/services/menu.ts
export class MenuService {
  async getFoodCandidates(restaurantId: string): Promise<string[]> {
    return apiService.request(`/restaurants/${restaurantId}/menu`);
  }
}

// In DietaryForm.tsx
const candidates = await menuService.getFoodCandidates(restaurantId);
const recommendations = await recommendationsService.getRecommendations(
  candidates,
  3,
  token
);
```

## Setup Instructions

### Environment Variables

1. Create `.env.local` from `.env.example`:
```bash
cp .env.example .env.local
```

2. Update backend URL if needed:
```
VITE_API_URL=http://localhost:8000
```

### Running Locally

**Terminal 1 - Frontend:**
```bash
npm run dev  # Runs on http://localhost:5173
```

**Terminal 2 - Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py  # Runs on http://localhost:8000
```

### Debugging API Issues

If you get CORS errors:
1. Check backend is running (`curl http://localhost:8000`)
2. Verify `CORS_ORIGINS` in `backend/main.py` includes frontend URL

If authentication fails:
1. Check Auth0 token with: `useAuth0().getAccessTokenSilently()`
2. Verify backend receives token: Add print statement in `autho.py`

If API returns 404:
1. Check endpoint path matches routes (e.g., `/preferences/`, not `/preference`)
2. Check HTTP method (GET vs POST)

## Performance Tips

1. **Cache preferences locally:**
```typescript
const [cachedPrefs, setCachedPrefs] = useState(null);

useEffect(() => {
  const cached = localStorage.getItem("user_prefs");
  if (cached) setCachedPrefs(JSON.parse(cached));
  loadFromServer(); // Update in background
}, []);
```

2. **Debounce recommendation requests:**
```typescript
// Only request recommendations after user stops typing for 500ms
const debouncedGetRecs = debounce(handleGetRecommendation, 500);
```

3. **Use streaming for long operations:**
Consider using Server-Sent Events (SSE) for streaming recommendations as Gemini generates them.

## Testing the Integration

### Test Preferences Flow
1. Go to onboarding form
2. Select some dietary preferences
3. Check backend database: `sqlite3 foodie.db "SELECT * FROM preferences;"`
4. Go to dashboard, verify preferences appear

### Test Voice Flow
1. Go to VoiceRecorder
2. Record audio mentioning foods (e.g., "I'm allergic to peanuts")
3. Check backend logs for transcription
4. Verify preferences were extracted and saved

### Test Recommendations Flow
1. Set some preferences via form
2. Submit DietaryForm
3. Check backend logs - Gemini should be called for scoring
4. Verify recommendations appear with scores and reasoning

## Architecture Decisions Made

1. **Flexible preference schema:** Each preference is `(type, value, category, metadata)` rather than fixed columns. This allows storing any kind of preference without schema changes.

2. **Service layer pattern:** Separates HTTP concerns from components, making it easy to swap backends or test components.

3. **Dual storage:** Preferences saved to both localStorage (immediate) and database (for AI), providing offline capability and persistence.

4. **Metadata tracking:** Storing `source` and other context helps understand where preferences come from for better UX.

5. **Stateless RPC-style routes:** Each endpoint is independent, making it easy to add/modify features without complex state management.

## Next Steps

1. Add real restaurant/food data source
2. Implement meal planning based on preferences
3. Add shopping list generation
4. Connect to nutrition APIs
5. Add user feedback loop to improve recommendations
6. Implement preferences sharing/templates

---

For questions or issues, check the component code comments for inline explanations of key patterns!
