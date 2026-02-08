import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

import VoiceRecorder from "./VoiceRecorder";
import ProfileForm from "./onboarding/ProfileForm";
import type { UserProfile } from "../types";

export default function MainApp() {
  const { user, logout } = useAuth0();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) return;

    const key = `foodie_profile_${user.sub}`;
    const stored = localStorage.getItem(key);
    setProfile(stored ? JSON.parse(stored) : null);
    setLoadingProfile(false);
  }, [user]);

  const handleOnboardingComplete = (profile: UserProfile) => {
    if (!user) return;
    const key = `foodie_profile_${user.sub}`;
    localStorage.setItem(key, JSON.stringify(profile));
    setProfile(profile);
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center bg-wave-gradient">
      <div className="w-full max-w-4xl px-6 pt-14 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-14">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            FoodieTrack Chatbox
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Log out
          </button>
        </div>

        {/* Intro */}
        <div className="mb-14 max-w-3xl">
          <p className="text-slate-700 leading-relaxed">
            FoodieTrack helps first-year university students make better food
            choices by understanding how they feel and what they need.
            Speak naturally — we’ll analyze mood, respect dietary preferences,
            and recommend meals that fit your day.
          </p>
        </div>

        {/* MAIN CARD — ALWAYS RENDERS */}
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-lg px-12 py-14 space-y-16">
          {!profile ? (
            <ProfileForm onComplete={handleOnboardingComplete} />
          ) : (
            <>
              {/* Section 1 */}
              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">
                  How to use the chatbox
                </h2>
                <p className="text-slate-600 leading-relaxed max-w-2xl">
                  Click the button below and speak naturally about how you’re
                  feeling or what you’re craving today. When you stop recording,
                  your message will be transcribed and used to generate
                  personalized food recommendations.
                </p>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">
                  Speak naturally
                </h2>
                <p className="text-slate-600 leading-relaxed max-w-2xl mb-10">
                  Talk about your mood, cravings, or how your day is going.
                  No keywords or commands needed.
                </p>

                <VoiceRecorder />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
