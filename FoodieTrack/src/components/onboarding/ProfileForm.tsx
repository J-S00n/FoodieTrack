import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import type {
  UserProfile,
  DietGoal,
  ActivityLevel,
  CookingAccess,
} from "../../types";
import { preferencesService } from "../../services/preferences";

interface Props {
  onComplete: (profile: UserProfile) => void;
}

type ArrayKeys =
  | "dietaryPreferences"
  | "dietaryRestrictions"
  | "preferredCuisines";

export default function ProfileForm({ onComplete }: Props) {
  const { getAccessTokenSilently } = useAuth0();
  const [profile, setProfile] = useState<UserProfile>({
    dietaryPreferences: [],
    dietaryRestrictions: [],
    preferredCuisines: [],
    otherAllergies: "",
    onDiet: false,
  });

  const [otherCuisines, setOtherCuisines] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleArrayValue = (key: ArrayKeys, value: string) => {
    setProfile(prev => {
      const arr = prev[key] ?? [];
      return {
        ...prev,
        [key]: arr.includes(value)
          ? arr.filter(v => v !== value)
          : [...arr, value],
      };
    });
  };

  /**
   * Save profile to both localStorage and backend database
   * 
   * This demonstrates:
   * - Converting form data to preference objects
   * - Saving to backend API
   * - Error handling during save
   */
  const handleComplete = async () => {
    setSaving(true);
    setError(null);

    try {
      // Save to localStorage (existing logic)
      onComplete(profile);

      // Also save to backend database for future reference and recommendations
      const token = await getAccessTokenSilently();

      // Build preferences list from profile data
      const prefsToSave = [
        // Save dietary preferences
        ...profile.dietaryPreferences.map((pref) => ({
          preference_type: "preference",
          value: pref.toLowerCase(),
          category: "diet",
          metadata: { source: "onboarding" },
        })),
        // Save dietary restrictions
        ...profile.dietaryRestrictions.map((restr) => ({
          preference_type: "restriction",
          value: restr.toLowerCase(),
          category: "allergy",
          metadata: { source: "onboarding" },
        })),
        // Save preferred cuisines
        ...(profile.preferredCuisines ?? []).map((cuisine) => ({
          preference_type: "cuisine_preference",
          value: cuisine.toLowerCase(),
          category: "cuisine",
          metadata: { source: "onboarding" },
        })),
      ];

      // Add custom allergies if provided
      if (profile.otherAllergies?.trim()) {
        prefsToSave.push({
          preference_type: "allergy",
          value: profile.otherAllergies,
          category: "custom",
          metadata: { source: "onboarding" },
        });
      }

      // Add diet goal if set
      if (profile.dietGoal) {
        prefsToSave.push({
          preference_type: "diet_goal",
          value: profile.dietGoal,
          category: "goal",
          metadata: { source: "onboarding" },
        });
      }

      // Add activity level if set
      if (profile.activityLevel) {
        prefsToSave.push({
          preference_type: "activity_level",
          value: profile.activityLevel,
          category: "lifestyle",
          metadata: { source: "onboarding" },
        });
      }

      // Add cooking access if set
      if (profile.cookingAccess) {
        prefsToSave.push({
          preference_type: "cooking_access",
          value: profile.cookingAccess,
          category: "practical",
          metadata: { source: "onboarding" },
        });
      }

      // Save all preferences to backend
      for (const pref of prefsToSave) {
        await preferencesService.create(pref, token);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to save profile: ${errorMsg}`);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>Set up your food profile</h2>

      {/* ======================
          SECTION 1 — DIET & SAFETY
         ====================== */}

      <h3>Dietary Preferences</h3>
      {["Vegan", "Vegetarian", "Pescatarian", "Halal", "Kosher"].map(p => (
        <label key={p} style={{ display: "block" }}>
          <input
            type="checkbox"
            onChange={() => toggleArrayValue("dietaryPreferences", p)}
          />{" "}
          {p}
        </label>
      ))}

      <h3>Dietary Restrictions / Allergies</h3>
      {["Gluten-free", "Dairy-free", "Nut-free"].map(r => (
        <label key={r} style={{ display: "block" }}>
          <input
            type="checkbox"
            onChange={() => toggleArrayValue("dietaryRestrictions", r)}
          />{" "}
          {r}
        </label>
      ))}

      <input
        placeholder="Other allergies (optional)"
        value={profile.otherAllergies}
        onChange={e =>
          setProfile(prev => ({ ...prev, otherAllergies: e.target.value }))
        }
        style={{ width: "100%", marginTop: "1rem", padding: "0.5rem" }}
      />

      {/* ======================
          SECTION 2 — GOALS & LIFESTYLE
         ====================== */}

      <h3>Diet Goal</h3>
      {(["Cut", "Maintain", "Bulk"] as DietGoal[]).map(goal => (
        <label key={goal} style={{ display: "block" }}>
          <input
            type="radio"
            name="dietGoal"
            checked={profile.dietGoal === goal}
            onChange={() =>
              setProfile(prev => ({
                ...prev,
                onDiet: true,
                dietGoal: goal,
              }))
            }
          />{" "}
          {goal}
        </label>
      ))}

      <h3>Activity Level</h3>
      {(
        ["Sedentary", "Light", "Active", "Very_active"] as ActivityLevel[]
      ).map(level => (
        <label key={level} style={{ display: "block" }}>
          <input
            type="radio"
            name="activityLevel"
            checked={profile.activityLevel === level}
            onChange={() =>
              setProfile(prev => ({ ...prev, activityLevel: level }))
            }
          />{" "}
          {level.replace("_", " ")}
        </label>
      ))}

      {/* ======================
          SECTION 3 — TASTE & PRACTICALITY
         ====================== */}

      <h3>Preferred Cuisines</h3>
      {[
        "Italian",
        "Chinese",
        "Japanese",
        "Korean",
        "Indian",
        "Middle Eastern",
        "Mexican",
        "Western",
      ].map(cuisine => (
        <label key={cuisine} style={{ display: "block" }}>
          <input
            type="checkbox"
            checked={profile.preferredCuisines?.includes(cuisine)}
            onChange={() =>
              toggleArrayValue("preferredCuisines", cuisine)
            }
          />{" "}
          {cuisine}
        </label>
      ))}

      <input
        placeholder="Other cuisines (comma separated)"
        value={otherCuisines}
        onChange={e => setOtherCuisines(e.target.value)}
        onBlur={() => {
          if (!otherCuisines.trim()) return;

          const extras = otherCuisines
            .split(",")
            .map(c => c.trim())
            .filter(Boolean);

          setProfile(prev => ({
            ...prev,
            preferredCuisines: Array.from(
              new Set([...(prev.preferredCuisines ?? []), ...extras])
            ),
          }));

          setOtherCuisines("");
        }}
        style={{
          width: "100%",
          marginTop: "0.75rem",
          padding: "0.5rem",
        }}
      />

      <h3>Cooking Access</h3>
      {(
        ["None", "Microwave", "Full_kitchen"] as CookingAccess[]
      ).map(access => (
        <label key={access} style={{ display: "block" }}>
          <input
            type="radio"
            name="cookingAccess"
            checked={profile.cookingAccess === access}
            onChange={() =>
              setProfile(prev => ({ ...prev, cookingAccess: access }))
            }
          />{" "}
          {access.replace("_", " ")}
        </label>
      ))}

      {/* ======================
          SUBMIT
         ====================== */}

      {error && <div style={{ color: "red", marginTop: "1rem" }}>{error}</div>}

      <button
        onClick={handleComplete}
        disabled={saving}
        style={{
          marginTop: "2rem",
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          borderRadius: "8px",
          background: saving ? "#999" : "#1f2937",
          color: "white",
          border: "none",
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}
