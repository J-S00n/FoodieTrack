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

const TOTAL_STEPS = 8;

export default function ProfileForm({ onComplete }: Props) {
  const { getAccessTokenSilently } = useAuth0();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    dietaryPreferences: [],
    dietaryRestrictions: [],
    preferredCuisines: [],
    otherAllergies: "",
  });

  const progressPct = ((step + 1) / TOTAL_STEPS) * 100;

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const toggleArray = (key: keyof UserProfile, value: string) => {
    setProfile(prev => {
      const arr = (prev[key] as string[]) ?? [];
      return {
        ...prev,
        [key]: arr.includes(value)
          ? arr.filter(v => v !== value)
          : [...arr, value],
      };
    });
  };

  const finish = async () => {
    setSaving(true);
    setError(null);

    try {
      onComplete(profile);

      const token = await getAccessTokenSilently();

      const prefs = [
        ...profile.dietaryPreferences.map(v => ({
          preference_type: "preference",
          value: v.toLowerCase(),
          category: "diet",
          metadata: { source: "onboarding" },
        })),
        ...profile.dietaryRestrictions.map(v => ({
          preference_type: "restriction",
          value: v.toLowerCase(),
          category: "allergy",
          metadata: { source: "onboarding" },
        })),
        ...(profile.preferredCuisines ?? []).map(v => ({
          preference_type: "cuisine_preference",
          value: v.toLowerCase(),
          category: "cuisine",
          metadata: { source: "onboarding" },
        })),
        profile.dietGoal && {
          preference_type: "diet_goal",
          value: profile.dietGoal,
          category: "goal",
          metadata: { source: "onboarding" },
        },
        profile.activityLevel && {
          preference_type: "activity_level",
          value: profile.activityLevel,
          category: "lifestyle",
          metadata: { source: "onboarding" },
        },
        profile.cookingAccess && {
          preference_type: "cooking_access",
          value: profile.cookingAccess,
          category: "practical",
          metadata: { source: "onboarding" },
        },
      ].filter(Boolean);

      for (const p of prefs) {
        // @ts-ignore
        await preferencesService.create(p, token);
      }
    } catch (e) {
      setError("Failed to save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "3rem auto", padding: "0 1rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div
          style={{
            height: 8,
            background: "#e5f5ec",
            borderRadius: 999,
            overflow: "hidden",
            marginBottom: "1.2rem",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              background: "#16a34a",
              height: "100%",
              transition: "width 0.3s",
            }}
          />
        </div>

        <div style={{ textAlign: "center", color: "#475569" }}>
          {step + 1} / {TOTAL_STEPS}
        </div>
      </div>

      {/* STEP CONTENT */}
      <div style={{ textAlign: "center", minHeight: 380 }}>
        {/* STEP 1 — NAME */}
        {step === 0 && (
          <>
            <h1 style={{ fontSize: 36, marginBottom: 12 }}>Welcome!</h1>
            <p style={{ color: "#64748b", marginBottom: 32 }}>
              Let’s personalize your FoodieTrack experience.
            </p>

            <input
              placeholder="What’s your name?"
              value={profile.name}
              onChange={e =>
                setProfile(prev => ({ ...prev, name: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "1rem",
                fontSize: 18,
                borderRadius: 12,
                border: "2px solid #16a34a",
              }}
            />
          </>
        )}

        {/* STEP 2 — DIET PREFS */}
        {step === 1 && (
          <>
            <h1 style={{ fontSize: 34 }}>
              Hi {profile.name || "there"}!
            </h1>
            <p style={{ marginBottom: 32 }}>
              Do you follow any of these diets?
            </p>

            {["Vegan", "Vegetarian", "Pescatarian", "Halal", "Kosher"].map(v => (
              <label
                key={v}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  border: "1px solid #d1fae5",
                  borderRadius: 14,
                  marginBottom: 12,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={profile.dietaryPreferences.includes(v)}
                  onChange={() =>
                    toggleArray("dietaryPreferences", v)
                  }
                />
                <span style={{ fontSize: 18 }}>{v}</span>
              </label>
            ))}
          </>
        )}

        {/* STEP 3 — RESTRICTIONS */}
        {step === 2 && (
          <>
            <h1 style={{ fontSize: 34 }}>Any allergies?</h1>
            <p style={{ marginBottom: 32 }}>
              We’ll make sure to avoid these.
            </p>

            {["Gluten-free", "Dairy-free", "Nut-free"].map(v => (
              <label
                key={v}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  border: "1px solid #d1fae5",
                  borderRadius: 14,
                  marginBottom: 12,
                }}
              >
                <input
                  type="checkbox"
                  checked={profile.dietaryRestrictions.includes(v)}
                  onChange={() =>
                    toggleArray("dietaryRestrictions", v)
                  }
                />
                <span>{v}</span>
              </label>
            ))}

            <input
              placeholder="Other allergies (optional)"
              value={profile.otherAllergies}
              onChange={e =>
                setProfile(p => ({
                  ...p,
                  otherAllergies: e.target.value,
                }))
              }
              style={{
                width: "100%",
                marginTop: 16,
                padding: "0.75rem",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
              }}
            />
          </>
        )}

        {/* STEP 4 — DIET GOAL */}
        {step === 3 && (
          <>
            <h1 style={{ fontSize: 34 }}>
              What’s your diet goal, {profile.name}?
            </h1>
            <p style={{ marginBottom: 32 }}>
              This helps us tailor calories and meal suggestions.
            </p>

            {[
              ["cut", "CUT – Lose fat"],
              ["maintain", "MAINTAIN – Maintain weight"],
              ["bulk", "BULK – Build muscle"],
            ].map(([v, label]) => (
              <button
                key={v}
                onClick={() =>
                  setProfile(p => ({
                    ...p,
                    dietGoal: v as DietGoal,
                  }))
                }
                style={{
                  width: "100%",
                  padding: "1.2rem",
                  borderRadius: 16,
                  marginBottom: 16,
                  fontSize: 18,
                  background:
                    profile.dietGoal === v ? "#16a34a" : "white",
                  color:
                    profile.dietGoal === v ? "white" : "#0f172a",
                  border: "2px solid #16a34a",
                }}
              >
                {label}
              </button>
            ))}
          </>
        )}

        {/* STEP 5 — ACTIVITY */}
        {step === 4 && (
          <>
            <h1 style={{ fontSize: 34 }}>Activity level</h1>
            <p style={{ marginBottom: 32 }}>
              How active are you on an average day?
            </p>

            {(
              ["Sedentary", "Light", "Active", "Very_active"] as ActivityLevel[]
            ).map(v => (
              <button
                key={v}
                onClick={() =>
                  setProfile(p => ({ ...p, activityLevel: v }))
                }
                style={{
                  width: "100%",
                  padding: "1rem",
                  marginBottom: 12,
                  borderRadius: 14,
                  border: "1px solid #d1fae5",
                  background:
                    profile.activityLevel === v ? "#bbf7d0" : "white",
                }}
              >
                {v.replace("_", " ")}
              </button>
            ))}
          </>
        )}

        {/* STEP 6 — CUISINES */}
        {step === 5 && (
          <>
            <h1 style={{ fontSize: 34 }}>Favorite cuisines</h1>
            <p style={{ marginBottom: 32 }}>
              What kinds of food do you enjoy?
            </p>

            {[
              "Italian",
              "Chinese",
              "Japanese",
              "Korean",
              "Indian",
              "Mexican",
              "Middle Eastern",
              "Western",
            ].map(v => (
              <label
                key={v}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "1rem",
                  borderRadius: 12,
                  border: "1px solid #d1fae5",
                  marginBottom: 10,
                }}
              >
                <input
                  type="checkbox"
                  checked={profile.preferredCuisines?.includes(v)}
                  onChange={() =>
                    toggleArray("preferredCuisines", v)
                  }
                />
                <span>{v}</span>
              </label>
            ))}
          </>
        )}

        {/* STEP 7 — COOKING */}
        {step === 6 && (
          <>
            <h1 style={{ fontSize: 34 }}>Cooking access</h1>
            <p style={{ marginBottom: 32 }}>
              What equipment do you usually have?
            </p>

            {(
              ["None", "Microwave", "Full_kitchen"] as CookingAccess[]
            ).map(v => (
              <button
                key={v}
                onClick={() =>
                  setProfile(p => ({ ...p, cookingAccess: v }))
                }
                style={{
                  width: "100%",
                  padding: "1rem",
                  marginBottom: 14,
                  borderRadius: 14,
                  background:
                    profile.cookingAccess === v ? "#16a34a" : "white",
                  color:
                    profile.cookingAccess === v ? "white" : "black",
                  border: "2px solid #16a34a",
                }}
              >
                {v.replace("_", " ")}
              </button>
            ))}
          </>
        )}

        {/* STEP 8 — DONE */}
        {step === 7 && (
          <>
            <h1 style={{ fontSize: 36 }}>You’re all set!</h1>
            <p style={{ marginBottom: 32 }}>
              Your profile is ready. Let’s start your daily check-in!
            </p>

            <button
              onClick={finish}
              disabled={saving}
              style={{
                padding: "1rem 2rem",
                fontSize: 18,
                borderRadius: 14,
                background: "#16a34a",
                color: "white",
                border: "none",
              }}
            >
              {saving ? "Saving…" : "Start using FoodieTrack →"}
            </button>
          </>
        )}
      </div>

      {/* NAV */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 32,
        }}
      >
        {step > 0 && (
          <button onClick={back} style={{ fontSize: 16 }}>
            ← Back
          </button>
        )}

        {step < TOTAL_STEPS - 1 && (
          <button onClick={next} style={{ fontSize: 16 }}>
            Next →
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: "red", marginTop: 16 }}>{error}</div>
      )}
    </div>
  );
}
