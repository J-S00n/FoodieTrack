/**
 * Voice API Service
 * 
 * Handles voice recording upload and analysis:
 * - Send audio to backend for transcription (ElevenLabs)
 * - Run Gemini analysis for sentiment, intent, keywords
 * - Automatically extract and save food preferences
 */

import { apiService } from "./api";

export interface VoiceInsights {
  transcript: string;
  sentiment?: string;
  intent?: string;
  keywords: string[];
}

export interface VoiceAnalysisResponse {
  insights: VoiceInsights;
  extracted_preferences?: Array<{
    preference_type: string;
    value: string;
    category: string;
    metadata: Record<string, unknown>;
  }>;
  message: string;
}

export class VoiceService {
  /**
   * Upload and analyze audio
   * 
   * The backend will:
   * 1. Transcribe the audio using ElevenLabs
   * 2. Analyze sentiment/intent/keywords using Gemini
   * 3. Extract food preferences from the analysis
   * 4. Save extracted preferences to the database
   * 
   * Example:
   * const result = await voiceService.analyzeAudio(
   *   audioBlob,
   *   true,  // use Gemini for analysis
   *   token
   * )
   */
  async analyzeAudio(
    audioBlob: Blob,
    useGemini: boolean = true,
    token: string
  ): Promise<VoiceAnalysisResponse> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");
    formData.append("use_gemini", String(useGemini));

    return apiService.requestMultipart<VoiceAnalysisResponse>(
      "/voice/analyze",
      formData,
      token
    );
  }
}

export const voiceService = new VoiceService();
