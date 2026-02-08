import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

import VoiceRecorder from "./VoiceRecorder";
import ProfileForm from "./onboarding/ProfileForm";
import type { UserProfile } from "../types";

export default function MainApp() {
  const { user, logout } = useAuth0();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Load profile scoped to Auth0 user
  useEffect(() => {
    if (!user) return;

    const key = `foodie_profile_${user.sub}`;
    const stored = localStorage.getItem(key);

    if (stored) {
      setProfile(JSON.parse(stored));
    } else {
      setProfile(null);
    }

    setLoadingProfile(false);
  }, [user]);

  // Save onboarding profile
  const handleOnboardingComplete = (profile: UserProfile) => {
    if (!user) return;

    const key = `foodie_profile_${user.sub}`;
    localStorage.setItem(key, JSON.stringify(profile));
    setProfile(profile);
  };

  // Logout (Auth0 handles session)
  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  if (loadingProfile) return <div>Loading...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2>Daily Check-in 👋</h2>
        <button onClick={handleLogout}>Log out</button>
      </div>

      {/* Onboarding OR Audio */}
      {!profile ? (
        <ProfileForm onComplete={handleOnboardingComplete} />
      ) : (
        <>
          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
            Your preferences are saved. Just speak naturally — we’ll take care of the rest.
          </p>
          <VoiceRecorder />
        </>
      )}
    </div>
  );
}
