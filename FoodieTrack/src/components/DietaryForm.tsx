import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  preferencesService,
  type PreferenceCreate,
} from "../services/preferences";
import {
  recommendationsService,
  type RecommendationResponse,
} from "../services/recommendations";

export default function DietaryForm() {
  const { getAccessTokenSilently } = useAuth0();

  const [preferences, setPreferences] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [contains] = useState<string[]>([]);
  const [otherAllergies, setOtherAllergies] = useState("");
  const [goal, setGoal] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] =
    useState<RecommendationResponse | null>(null);

  const toggle = (
    value: string,
    list: string[],
    setter: (v: string[]) => void
  ) => {
    setter(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value]
    );
  };

  const handleGetRecommendation = async () => {
    setLoading(true);
    setError(null);
    setRecommendations(null);

    try {
      const token = await getAccessTokenSilently();

      // ================================
      // 1️⃣ SAVE PREFERENCES TO DB (UNCHANGED)
      // ================================
      const prefsToSave: PreferenceCreate[] = [
        ...preferences.map((p) => ({
          preference_type: "preference",
          value: p.toLowerCase(),
          category: "diet",
          metadata: { source: "form" },
        })),
        ...restrictions.map((r) => ({
          preference_type: "restriction",
          value: r.toLowerCase(),
          category: "allergy",
          metadata: { source: "form" },
        })),
        ...contains.map((c) => ({
          preference_type: "warning",
          value: c.toLowerCase(),
          category: "allergen_info",
          metadata: { source: "form" },
        })),
      ];

      if (otherAllergies) {
        prefsToSave.push({
          preference_type: "allergy",
          value: otherAllergies.toLowerCase(),
          category: "custom",
          metadata: { source: "form" },
        });
      }

      if (goal) {
        prefsToSave.push({
          preference_type: "goal",
          value: goal.toLowerCase(),
          category: "diet",
          metadata: { source: "form" },
        });
      }

      for (const pref of prefsToSave) {
        await preferencesService.create(pref, token);
      }

      // ================================
      // 2️⃣ BUILD GEMINI-READY PREFERENCES
      // ================================
      const geminiPreferences = {
        dietary_restrictions: preferences.map((p) => p.toLowerCase()),
        restrictions: restrictions.map((r) => r.toLowerCase()),
        contains: contains.map((c) => c.toLowerCase()),
        other_allergies: otherAllergies
          ? [otherAllergies.toLowerCase()]
          : [],
        goal: goal.toLowerCase(),
      };

      // ================================
      // 3️⃣ STORE IN LOCAL STORAGE
      // ================================
      localStorage.setItem(
        "geminiPreferences",
        JSON.stringify(geminiPreferences)
      );

      // ================================
      // 4️⃣ CALL RECOMMENDATIONS ENDPOINT
      // ================================
      const recs = await recommendationsService.getRecommendations(
        {
          transcript: "voice transcript will be added later",
          preferences: geminiPreferences,
        },
        token
      );

      setRecommendations(recs);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to get recommendations: ${errorMsg}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem", maxWidth: "600px" }}>
      <h2>🥗 Dietary Preferences & Restrictions</h2>

      <h3>Dietary Preferences</h3>
      {["Vegan", "Vegetarian", "Pescatarian", "Halal", "Kosher"].map((p) => (
        <label key={p} style={{ display: "block" }}>
          <input
            type="checkbox"
            onChange={() => toggle(p, preferences, setPreferences)}
          />{" "}
          {p}
        </label>
      ))}

      <h3 style={{ marginTop: "1rem" }}>Dietary Restrictions / Allergies</h3>
      {["Gluten-free", "Dairy-free", "Nut-free"].map((r) => (
        <label key={r} style={{ display: "block" }}>
          <input
            type="checkbox"
            onChange={() => toggle(r, restrictions, setRestrictions)}
          />{" "}
          {r}
        </label>
      ))}

      <label style={{ display: "block", marginTop: "0.5rem" }}>
        Other allergies:
        <input
          type="text"
          value={otherAllergies}
          onChange={(e) => setOtherAllergies(e.target.value)}
        />
      </label>

      <h3 style={{ marginTop: "1rem" }}>Goal</h3>
      {["Comfort", "High protein", "Energy boost", "Light / healthy"].map(
        (g) => (
          <label key={g} style={{ display: "block" }}>
            <input
              type="radio"
              name="goal"
              onChange={() => setGoal(g)}
            />{" "}
            {g}
          </label>
        )
      )}

      {error && <div style={{ color: "red" }}>{error}</div>}

      <button
        style={{ marginTop: "1.5rem" }}
        onClick={handleGetRecommendation}
        disabled={loading}
      >
        {loading ? "Loading..." : "Get Recommendation"}
      </button>

      {recommendations && (
        <pre style={{ marginTop: "2rem" }}>
          {JSON.stringify(recommendations, null, 2)}
        </pre>
      )}
    </div>
  );
}
