/**
 * Recommendations API Service
 *
 * Sends user transcript + preferences to backend
 * Backend handles:
 * - Auth
 * - Backboard memory
 * - Snowflake menu
 * - Gemini reasoning
 */

export type RecommendationResponse = {
  mood: {
    label: string;
    confidence: number;
  };
  recommendations: {
    food: string;
    reason: string;
    calories: number;
  }[];
  explainability?: {
    mood_detected_from: string;
    constraints_used: string[];
    tradeoff: string;
  };
};

export const recommendationsService = {
  async getRecommendations(
    payload: {
      transcript: string;
      preferences: any;
    },
    token: string
  ): Promise<RecommendationResponse> {
    const res = await fetch("http://localhost:8000/recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to fetch recommendations");
    }

    return res.json();
  },
};

