export type DietGoal = "Cut" | "Maintain" | "Bulk";
export type ActivityLevel = "Sedentary" | "Light" | "Active" | "Very_active";
export type CookingAccess = "None" | "Microwave" | "Full_kitchen";

export interface UserProfile {
  name?: string;
  dietaryPreferences: string[];
  dietaryRestrictions: string[];
  otherAllergies?: string;

  heightCm?: number;
  weightKg?: number;

  onDiet?: boolean;
  dietGoal?: DietGoal;

  activityLevel?: ActivityLevel;
  cookingAccess?: CookingAccess;
  preferredCuisines?: string[];
}
