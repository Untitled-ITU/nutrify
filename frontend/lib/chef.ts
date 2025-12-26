import { API_BASE_URL } from "@/lib/config";
import { authFetch } from "@/app/providers/AuthProvider";

export type Profile = {
  id: number;
  email: string;
  username: string;
  role: "consumer" | "chef" | "admin" | string;
};

export type ChefRecipeSummary = {
  id: number;
  title: string;
  description?: string | null;
  image_url?: string | null;     
  category?: string | null;
  cuisine?: string | null;
  num_ingredients?: number | null;
  average_rating?: number | null;
  rating_count: number;
  created_at?: string | null;
};


export type ChefStats = {
  total_recipes: number;
  total_ratings: number;
  average_rating?: number | null;
  recipes_by_category: Record<string, number>;
};

export type ChefPublicProfile = {
  chef_id: number;
  username: string;
  role?: string;
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  stats: ChefStats;
  recipes: ChefRecipeSummary[];
};



export type ChefOwnProfile = {
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  avatar_url?: string | null;
};

export type UpdateChefOwnProfilePayload = {
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  avatar_name?: string | null;
};

export type CreateRecipePayload = {
  title: string;
  description?: string | null;
  category?: string | null;
  cuisine?: string | null;
  meal_type?: string | null;
  is_vegan?: boolean;
  is_vegetarian?: boolean;
  directions?: string | null;
  ingredients?: Array<{
    ingredient_id?: number | null;
    name?: string | null;
    quantity?: number | null;
    unit?: string | null;
  }>;
};

export type UpdateRecipePayload = Partial<CreateRecipePayload>;

export async function fetchProfile(): Promise<Profile> {
  const res = await authFetch(`${API_BASE_URL}/api/auth/profile`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function updateUsername(username: string): Promise<{ msg: string }> {
  const res = await authFetch(`${API_BASE_URL}/api/auth/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export async function fetchChefRecipes(): Promise<{ recipes: ChefRecipeSummary[] }> {
  const res = await authFetch(`${API_BASE_URL}/api/chef/recipes`);
  if (!res.ok) throw new Error("Failed to fetch chef recipes");
  return res.json();
}

export async function fetchChefStats(): Promise<ChefStats> {
  const res = await authFetch(`${API_BASE_URL}/api/chef/stats`);
  if (!res.ok) throw new Error("Failed to fetch chef stats");
  return res.json();
}

export async function createChefRecipe(payload: CreateRecipePayload): Promise<{ msg: string; recipe_id: number }> {
  const res = await authFetch(`${API_BASE_URL}/api/chef/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create recipe");
  return res.json();
}

export async function getChefRecipeForEdit(recipeId: number): Promise<any> {
  const res = await authFetch(`${API_BASE_URL}/api/chef/recipes/${recipeId}`);
  if (!res.ok) throw new Error("Failed to fetch recipe detail");
  return res.json();
}

export async function updateChefRecipe(recipeId: number, payload: UpdateRecipePayload): Promise<{ msg: string }> {
  const res = await authFetch(`${API_BASE_URL}/api/chef/recipes/${recipeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update recipe");
  return res.json();
}

export async function deleteChefRecipe(recipeId: number): Promise<{ msg: string }> {
  const res = await authFetch(`${API_BASE_URL}/api/chef/recipes/${recipeId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete recipe");
  return res.json();
}

export async function fetchChefOwnProfile(): Promise<ChefOwnProfile> {
  const res = await authFetch(`${API_BASE_URL}/api/chef/profile`);
  if (!res.ok) throw new Error("Failed to fetch chef profile");
  return res.json();
}

export async function updateChefOwnProfile(
  payload: UpdateChefOwnProfilePayload
): Promise<{ msg: string }> {
  const res = await authFetch(`${API_BASE_URL}/api/chef/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update chef profile");
  return res.json();
}

export async function forgotPassword(payload: { email: string }): Promise<{ msg: string; email: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.msg || "Forgot password failed");
  return data;
}

export async function resetPassword(payload: {
  email: string;
  code: string; // exactly 6
  new_password: string; // min 6
}): Promise<{ msg: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.msg || "Reset password failed");
  return data;
}


export async function fetchChefPublicProfile(chefId: number): Promise<ChefPublicProfile> {

  let res = await authFetch(`${API_BASE_URL}/api/public/chefs/${chefId}`, { method: "GET" });


  if (!res.ok) {
    res = await fetch(`${API_BASE_URL}/api/public/chefs/${chefId}`, { cache: "no-store" });
  }

  if (!res.ok) throw new Error("Failed to fetch public chef profile");

  const data = await res.json();


  return {
    chef_id: data.chef_id ?? chefId,
    username: data.username,
    bio: data.bio ?? null,
    website: data.website ?? null,
    location: data.location ?? null,
    avatar_url: data.avatar_url ?? null,

    stats: data.stats ?? {
      total_recipes: 0,
      total_ratings: 0,
      average_rating: null,
      recipes_by_category: {},
    },

    recipes: data.recipes ?? [],
  };
}

export async function fetchChefPublicRecipes(chefId: number): Promise<{ recipes: ChefRecipeSummary[] }> {

  let res = await fetch(`${API_BASE_URL}/api/public/chefs/${chefId}/recipes`, { cache: "no-store" });

  if (res.ok) {
    return res.json();
  }

  
  const profile = await fetchChefPublicProfile(chefId);
  return { recipes: profile.recipes ?? [] };
}


