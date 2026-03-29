import { useRef, useState, useEffect } from "react";
import { ElevenLabsClient } from "elevenlabs";
import Results from "./Results";


import { useAuth0 } from "@auth0/auth0-react";

export default function VoiceRecorder() {
  const { user } = useAuth0();
  const [profile, setProfile] = useState(null);

  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [results, setResults] = useState(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
      if (!user) return;
  
      const key = `foodie_profile_${user.sub}`;
      const stored = localStorage.getItem(key);
  
      if (stored) {
        setProfile(JSON.parse(stored));
      } else {
        setProfile(null);
      }
    }, [user]);

  // ElevenLabs client (unchanged)
  const elevenlabs = new ElevenLabsClient({
    apiKey: "sk_286b4a20715a1271d27b2cf6ab10eac6ef020af6d5085fea",
  });

  const startRecording = async () => {
    setHasResults(false);
    setResults(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioURL(URL.createObjectURL(blob));

      try {
        const file = new File([blob], "recording.webm", { type: blob.type });

        const result = await elevenlabs.speechToText.convert({
          file,
          model_id: "scribe_v2",
        });

        setTranscript(result.text || "No transcript returned.");

        // Optional backend persistence (kept from teammate)
        /*await fetch("http://localhost:8000/api/store-transcript", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transcript: result.text }),
        });*/
      } catch (err) {
        console.error(err);
        setTranscript("Error transcribing audio.");
      }
    };

    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };
  const { getAccessTokenSilently } = useAuth0();

  const analyzeData = async () => {
  try {
    setLoading(true);
    if (!transcript) {
      alert("No transcript available yet.");
      return;
    }

    // Auth token
    const token = await getAccessTokenSilently();

    console.log("user preferences: ", profile ? JSON.stringify(profile) : null);

    // Call backend → Gemini
    const response = await fetch("http://localhost:8000/recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        transcript,
        preferences: profile ? JSON.stringify(profile) : null,
      }),
    });

    const data = await response.json();
    console.log("AI Recommendation Result:", data);
    setResults(data);
    setLoading(false);
    setHasResults(true);

  } catch (err) {
    console.error("Failed to analyze voice data:", err);
    alert("Failed to analyze mood and recommend food.");
  }
};

  return (
    <div className="w-full flex flex-col items-center">
      {/* Record Button */}
      <div className="mb-10">
        {!recording ? (
          <button
            onClick={startRecording}
            disabled={loading}
            className="px-10 py-4 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition disabled:opacity-50"
          >
            Start recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-10 py-4 rounded-full bg-rose-500 text-white font-semibold hover:bg-rose-600 transition"
          >
            Stop recording
          </button>
        )}
      </div>

      {/* Playback */}
      {audioURL && (
        <div className="mb-8">
          <audio controls src={audioURL} />
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div
          ref={transcriptRef}
          className="w-full max-w-2xl bg-slate-50 rounded-2xl p-8 border border-slate-200 mb-12"
        >
          <p className="text-sm font-medium text-slate-800 mb-2">
            Transcript
          </p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {transcript}
          </p>
        </div>
      )}

      {/* Confirm / Loading */}
      {transcript && (
        <div className="w-full max-w-md">
          {!loading ? (
            <button
              onClick={(analyzeData)}
              className="w-full px-4 py-3 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition"
            >
              What should I get?
            </button>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 mb-3">
                Analyzing your input…
              </p>

              {/* Animated loading bar */}
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-emerald-500 animate-loading-bar" />
              </div>
            </div>
          )}
        </div>
      )}
      {hasResults && <Results results={results}></Results>}
    </div>
  );
}
