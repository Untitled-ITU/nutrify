"use client";

import { useCallback, useEffect, useState } from "react";
import { RecipeExplorer } from "@/components/recipes/RecipeExplorer";
import { Recipe } from "@/components/recipes/types";
import { API_BASE_URL } from "@/lib/config";
import { authFetch } from "@/app/providers/AuthProvider";
import { ActionIcon, Menu, Select, TextInput, useMantineTheme } from "@mantine/core";
import { IconArrowsSort, IconBookmark, IconCheck, IconHeart, IconHeartBroken, IconPlus, IconSearch, IconX } from "@tabler/icons-react";
import { handleAddFavorite, handleRemoveFavorite } from "@/lib/tableActions";
import { AddToCollectionMenu } from "@/components/recipes/AddToCollectionMenu";
import { AddToPlanButton } from "@/components/meal-plan/AddToPlanButton";

type RecipesResponse = {
    favorites: Recipe[];
};

type RecipeFilters = {
    q?: string;
    ingredients?: string[];
    sort_by?: string;
};

export default function FavoritesPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [filters, setFilters] = useState<RecipeFilters>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const theme = useMantineTheme();
    const onRemove = async (r: Recipe) => {
        try {
            const removedId = await handleRemoveFavorite(r);

            setRecipes((prev) =>
                prev.filter((recipe) => recipe.id !== removedId)
            );
        } catch {
            // notification already shown
        }
    };

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
                "/api/recipes/favorites" +
                (params.toString() ? `?${params.toString()}` : "");

            const res = await authFetch(url);

            if (!res.ok) {
                throw new Error("Failed to fetch recipes");
            }

            const data: RecipesResponse = await res.json();
            setRecipes(data.favorites);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    /**
     * 🔥 Refetch when filters change
     */
    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    return (
        <div className="w-full px-4">
            <h1 className="text-4xl font-bold mb-8">
                Favorite Recipes
            </h1>

            <RecipeExplorer
                recipes={recipes}
                onFiltersChangeAction={setFilters}
                disableIngredientFilter={true}
                renderActions={(r) => (
                    <>
                        <AddToPlanButton
                            recipeId={r.id}
                            recipeTitle={r.title}
                            variant="icon"
                        />
                        <ActionIcon
                            style={{ backgroundColor: theme.other.primaryDark }}
                                onClick={() => onRemove(r)}
                        >
                            <IconX size={18} />
                        </ActionIcon>
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
