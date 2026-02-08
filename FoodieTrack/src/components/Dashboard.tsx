import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { preferencesService, type PreferenceRead } from "../services/preferences";

export default function Dashboard() {
  const { getAccessTokenSilently } = useAuth0();
  const [preferences, setPreferences] = useState<PreferenceRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user preferences on component mount
   * 
   * This demonstrates:
   * - Using useEffect to fetch data on load
   * - Handling async operations in React
   * - Proper cleanup and error handling
   */
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessTokenSilently();
      const prefs = await preferencesService.list(token);
      setPreferences(prefs);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to load preferences: ${errorMsg}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group preferences by category for better display
  const groupedPreferences = preferences.reduce(
    (acc, pref) => {
      if (!acc[pref.category]) {
        acc[pref.category] = [];
      }
      acc[pref.category].push(pref);
      return acc;
    },
    {} as Record<string, PreferenceRead[]>
  );

  const preferenceCount = preferences.length;
  const categories = Object.keys(groupedPreferences).length;

  return (
    <div style={{ padding: "2rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1>Your Food Profile Dashboard</h1>
      </header>

      <main>
        {/* Stats section */}
        <section style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            <div
              style={{
                padding: "1rem",
                background: "#e3f2fd",
                borderRadius: "8px",
              }}
            >
              <h3>Total Preferences</h3>
              <p style={{ fontSize: "2em", margin: 0 }}>{preferenceCount}</p>
            </div>
            <div
              style={{
                padding: "1rem",
                background: "#f3e5f5",
                borderRadius: "8px",
              }}
            >
              <h3>Categories</h3>
              <p style={{ fontSize: "2em", margin: 0 }}>{categories}</p>
            </div>
            <div
              style={{
                padding: "1rem",
                background: "#e8f5e9",
                borderRadius: "8px",
              }}
            >
              <h3>Profile Status</h3>
              <p style={{ fontSize: "2em", margin: 0 }}>
                {preferenceCount > 0 ? "Complete" : "Incomplete"}
              </p>
            </div>
          </div>
        </section>

        {/* Preferences section */}
        <section>
          <h2>Your Preferences</h2>

          {loading && <p>Loading preferences...</p>}

          {error && <div style={{ color: "red", padding: "1rem" }}>{error}</div>}

          {!loading && !error && preferenceCount === 0 && (
            <p style={{ color: "#666" }}>
              No preferences yet. Set them up in your profile or using voice recognition!
            </p>
          )}

          {!loading &&
            !error &&
            Object.entries(groupedPreferences).map(([category, prefs]) => (
              <div key={category} style={{ marginBottom: "2rem" }}>
                <h3 style={{ textTransform: "capitalize" }}>
                  {category.replace("_", " ")}
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  {prefs.map((pref) => (
                    <div
                      key={pref.id}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#f0f0f0",
                        borderRadius: "20px",
                        fontSize: "0.9rem",
                      }}
                    >
                      <span style={{ textTransform: "capitalize" }}>
                        {pref.value}
                      </span>
                      <span style={{ color: "#999", fontSize: "0.8rem" }}>
                        {" "}
                        ({pref.preference_type})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {!loading && !error && preferenceCount > 0 && (
            <button onClick={loadPreferences} style={{ marginTop: "1rem" }}>
              Refresh Preferences
            </button>
          )}
        </section>
      </main>
    </div>
  );
}