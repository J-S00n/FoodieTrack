/**
 * Preferences API Service
 * 
 * Handles all preference-related API calls:
 * - Create, read, update, delete preferences
 * - Export preferences for LLM processing
 */

import { apiService } from "./api";

export interface PreferenceCreate {
  preference_type: string;
  value: string;
  category: string;
  metadata?: Record<string, unknown>;
}

export interface PreferenceRead extends PreferenceCreate {
  id: number;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface PreferencesExport {
  user_id: string;
  preferences: Array<{
    type: string;
    value: string;
    category: string;
    metadata: Record<string, unknown>;
  }>;
}

export class PreferencesService {
  /**
   * Create a new preference for the current user
   * 
   * Example:
   * await preferencesService.create(
   *   {
   *     preference_type: "restriction",
   *     value: "gluten-free",
   *     category: "food"
   *   },
   *   token
   * )
   */
  async create(
    data: PreferenceCreate,
    token: string
  ): Promise<PreferenceRead> {
    return apiService.request<PreferenceRead>(
      "/preferences/",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  }

  /**
   * Get all preferences for the current user
   */
  async list(token: string): Promise<PreferenceRead[]> {
    return apiService.request<PreferenceRead[]>(
      "/preferences/",
      { method: "GET" },
      token
    );
  }

  /**
   * Get preferences formatted for LLM processing
   * Useful before generating recommendations
   */
  async export(token: string): Promise<PreferencesExport> {
    return apiService.request<PreferencesExport>(
      "/preferences/export",
      { method: "GET" },
      token
    );
  }

  /**
   * Update an existing preference
   */
  async update(
    preferenceId: number,
    data: PreferenceCreate,
    token: string
  ): Promise<PreferenceRead> {
    return apiService.request<PreferenceRead>(
      `/preferences/${preferenceId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token
    );
  }

  /**
   * Delete a preference
   */
  async delete(preferenceId: number, token: string): Promise<void> {
    return apiService.request<void>(
      `/preferences/${preferenceId}`,
      { method: "DELETE" },
      token
    );
  }
}

export const preferencesService = new PreferencesService();
