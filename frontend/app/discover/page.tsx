"use client";

import { useCallback, useEffect, useState } from "react";
import { RecipeExplorer } from "@/components/recipes/RecipeExplorer";
import { Recipe } from "@/components/recipes/types";
import { API_BASE_URL } from "@/lib/config";
import { authFetch } from "../providers/AuthProvider";
import { ActionIcon, Button, Menu, Select, TextInput, useMantineTheme } from "@mantine/core";
import { IconArrowsSort, IconBookmark, IconCheck, IconHeart, IconHeartFilled, IconPlus, IconSearch, IconX } from "@tabler/icons-react";
import { handleAddFavorite, handleRemoveFavorite } from "@/lib/tableActions";
import { AddToCollectionMenu } from "@/components/recipes/AddToCollectionMenu";
import { AddToPlanButton } from "@/components/meal-plan/AddToPlanButton";

type RecipesResponse = {
    recipes: Recipe[];
};

type RecipeFilters = {
    q?: string;
    ingredients?: string[];
    sort_by?: string;
};

export default function DiscoverPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [filters, setFilters] = useState<RecipeFilters>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const theme = useMantineTheme();

    const fetchRecipes = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();

            // if (filters.q) params.set("q", filters.q);
            // if (filters.sort_by) params.set("sort_by", filters.sort_by);
            if (filters.ingredients?.length) {
                params.set("ingredients", filters.ingredients.join(","));
            }
            // params.set("sort_order", "asc");

            const url =
                API_BASE_URL +
                "/api/recipes" +
                (params.toString() ? `?${params.toString()}` : "");

            const res = await authFetch(url);

            if (!res.ok) {
                throw new Error("Failed to fetch recipes");
            }

            const data: RecipesResponse = await res.json();
            setRecipes(data.recipes);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const toggleFavorite = async (recipe: Recipe) => {
        try {
            if (recipe.is_favorite) {
                await handleRemoveFavorite(recipe);
            } else {
                await handleAddFavorite(recipe);
            }

            // Optimistic UI update
            setRecipes(prev =>
                prev.map(r =>
                    r.id === recipe.id
                        ? { ...r, is_favorite: !r.is_favorite }
                        : r
                )
            );
        } catch {
            // optional notification
        }
    };

    /**
     * 🔥 Refetch when filters change
     */
    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    return (
        <div className="w-full px-4">
            <h1 className="text-4xl font-bold mb-8">
                Discover New Recipes
            </h1>

            <RecipeExplorer
                recipes={recipes}
                onFiltersChangeAction={setFilters}
                renderActions={(r) => (
                    <>
                        <ActionIcon
                            style={{ backgroundColor: theme.other.primaryDark }}
                            onClick={() => toggleFavorite(r)}
                        >
                            {r.is_favorite ? (
                                <IconHeartFilled size={18} />
                            ) : (
                                <IconHeart size={18} />
                            )}
                        </ActionIcon>
                        <AddToPlanButton
                            recipeId={r.id}
                            recipeTitle={r.title}
                            variant="icon"
                        />
                        <Menu shadow="md" width={220}>
                            <Menu.Target>
                                <ActionIcon
                                    style={{ backgroundColor: theme.other.primaryDark }}
                                >
                                    <IconBookmark size={18} />
                                </ActionIcon>
                            </Menu.Target>
                            <AddToCollectionMenu variant="dropdown" recipe={r} />
                        </Menu>
                    </>
                )}
            />

            {loading && (
                <div className="text-center py-10 text-gray-500">
                    Loading recipes...
                </div>
            )}

            {error && (
                <div className="text-center py-10 text-red-500">
                    {error}
                </div>
            )}
        </div>
    );
}
