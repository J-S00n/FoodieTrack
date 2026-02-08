import { useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { voiceService, type VoiceAnalysisResponse } from "../services/voice";

export default function VoiceRecorder() {
  const { getAccessTokenSilently } = useAuth0();
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<VoiceAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioChunkRef = useRef<Blob | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        audioChunkRef.current = blob;
        setAudioURL(URL.createObjectURL(blob));
      };

      recorder.start();
      setRecording(true);
      setError(null);
    } catch (err) {
      setError("Failed to access microphone");
      console.error(err);
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  /**
   * Send the recorded audio to the backend for analysis
   * 
   * This calls the /voice/analyze endpoint which:
   * 1. Transcribes using ElevenLabs
   * 2. Analyzes sentiment/intent/keywords with Gemini
   * 3. Extracts food preferences automatically
   * 4. Saves preferences to database
   */
  const handleUploadAudio = async () => {
    if (!audioChunkRef.current) {
      setError("No audio to upload");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const token = await getAccessTokenSilently();
      const result = await voiceService.analyzeAudio(
        audioChunkRef.current,
        true, // use Gemini for analysis
        token
      );
      setAnalysis(result);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Analysis failed: ${errorMsg}`);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc" }}>
      <h3>Voice Check-in 🎤</h3>

      {!recording ? (
        <button onClick={startRecording}>Start Recording</button>
      ) : (
        <button onClick={stopRecording} style={{ background: "#ff4444" }}>
          Stop Recording
        </button>
      )}

      {audioURL && (
        <div>
          <p>Playback:</p>
          <audio controls src={audioURL} />
          <button onClick={handleUploadAudio} disabled={uploading}>
            {uploading ? "Analyzing..." : "Analyze & Save Preferences"}
          </button>
        </div>
      )}

      {error && <div style={{ color: "red", marginTop: "1rem" }}>{error}</div>}

      {analysis && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: "#f0f0f0" }}>
          <h4>Analysis Results</h4>
          <p>
            <strong>Transcript:</strong> {analysis.insights.transcript}
          </p>
          {analysis.insights.sentiment && (
            <p>
              <strong>Sentiment:</strong> {analysis.insights.sentiment}
            </p>
          )}
          {analysis.insights.intent && (
            <p>
              <strong>Intent:</strong> {analysis.insights.intent}
            </p>
          )}
          {analysis.insights.keywords && (
            <p>
              <strong>Keywords:</strong> {analysis.insights.keywords.join(", ")}
            </p>
          )}
          {analysis.extracted_preferences && (
            <div>
              <strong>Extracted Preferences:</strong>
              <ul>
                {analysis.extracted_preferences.map((pref, idx) => (
                  <li key={idx}>
                    {pref.preference_type}: {pref.value}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
