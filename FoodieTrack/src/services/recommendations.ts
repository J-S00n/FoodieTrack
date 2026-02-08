/**
 * Recommendations API Service
 * 
 * Gets food recommendations based on user preferences and candidate items
 * Uses Gemini AI to score and rank options
 */

import { apiService } from "./api";

export interface RecommendationItem {
  item: string;
  score: number;
  reason?: string;
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[];
}

export class RecommendationsService {
  /**
   * Get food recommendations based on user's preferences
   * 
   * The backend will:
   * 1. Fetch user's stored preferences
   * 2. Score each candidate against those preferences using Gemini
   * 3. Return top_k recommendations with reasoning
   * 
   * Example:
   * const results = await recommendationsService.getRecommendations(
   *   ["pizza", "salad", "burger", "sushi"],
   *   3,  // return top 3
   *   token
   * )
   */
  async getRecommendations(
    candidates: string[],
    topK: number = 3,
    token: string
  ): Promise<RecommendationResponse> {
    return apiService.request<RecommendationResponse>(
      "/recommendations/",
      {
        method: "POST",
        body: JSON.stringify({
          candidates,
          top_k: topK,
        }),
      },
      token
    );
  }
}

export const recommendationsService = new RecommendationsService();
