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
  const [contains, setContains] = useState<string[]>([]);
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

  /**
   * Save dietary preferences and get food recommendations
   *
   * This demonstrates the full flow:
   * 1. Save all form selections to the database via /preferences/ endpoint
   * 2. Call /recommendations/ with food candidates to get AI-scored recommendations
   * 3. The backend uses Gemini to score items based on user's stored preferences
   */
  const handleGetRecommendation = async () => {
    setLoading(true);
    setError(null);
    setRecommendations(null);

    try {
      const token = await getAccessTokenSilently();

      // Save preferences first
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
          value: otherAllergies,
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

      // Save all preferences to database
      for (const pref of prefsToSave) {
        await preferencesService.create(pref, token);
      }

      // Example food candidates - in real app, these might come from a menu API
      const candidates = [
        "Grilled chicken salad",
        "Vegan Buddha bowl",
        "Classic burger",
        "Sushi platter",
        "Vegetarian pasta",
        "Gluten-free pizza",
        "Fish and chips",
        "Quinoa bowl",
      ];

      // Get AI-powered recommendations based on stored preferences
      const recs = await recommendationsService.getRecommendations(
        candidates,
        3,
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
      <p style={{ fontSize: "0.9rem", color: "#555" }}>
        Leave preferences unselected if you have no specific dietary preference.
      </p>

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
        Other allergies (optional):
        <input
          type="text"
          value={otherAllergies}
          onChange={(e) => setOtherAllergies(e.target.value)}
          placeholder="e.g. sesame, shellfish"
          style={{ width: "100%", marginTop: "0.25rem" }}
        />
      </label>

      <h3 style={{ marginTop: "1rem" }}>Contains / May Contain</h3>
      {["Contains mustard", "May contain peanuts", "May contain tree nuts"].map(
        (c) => (
          <label key={c} style={{ display: "block" }}>
            <input
              type="checkbox"
              onChange={() => toggle(c, contains, setContains)}
            />{" "}
            {c}
          </label>
        )
      )}

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

      {error && <div style={{ color: "red", marginTop: "1rem" }}>{error}</div>}

      <button
        style={{ marginTop: "1.5rem", padding: "0.5rem 1rem" }}
        onClick={handleGetRecommendation}
        disabled={loading}
      >
        {loading ? "Loading..." : "Get Recommendation"}
      </button>

      {recommendations && (
        <div style={{ marginTop: "2rem", padding: "1rem", background: "#f0f0f0" }}>
          <h3>Top Recommendations For You 🍽️</h3>
          {recommendations.recommendations.map((rec, idx) => (
            <div
              key={idx}
              style={{
                padding: "1rem",
                margin: "0.5rem 0",
                background: "white",
                border: "1px solid #ddd",
              }}
            >
              <strong>{rec.item}</strong>
              <p>Match: {(rec.score * 100).toFixed(0)}%</p>
              {rec.reason && <p style={{ fontSize: "0.9rem" }}>{rec.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
