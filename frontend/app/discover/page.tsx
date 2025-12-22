"use client";

import { useCallback, useEffect, useState } from "react";
import { RecipeExplorer } from "@/components/recipes/RecipeExplorer";
import { Recipe } from "@/components/recipes/types";
import { API_BASE_URL } from "@/lib/config";
import { authFetch } from "../providers/AuthProvider";
import { ActionIcon, Menu, Select, TextInput, useMantineTheme } from "@mantine/core";
import { IconArrowsSort, IconBookmark, IconCheck, IconHeart, IconPlus, IconSearch, IconX } from "@tabler/icons-react";
import { handleAddFavorite } from "@/lib/tableActions";
import { AddToCollectionMenu } from "@/components/recipes/AddToCollectionMenu";

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
                    <Menu shadow="md" width={200} position="bottom-end">
                        <Menu.Target>
                            <ActionIcon style={{ backgroundColor: theme.other.accentColor }}>
                                <IconPlus size={28} />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Item
                                leftSection={<IconHeart size={16} />}
                                onClick={() => handleAddFavorite(r)}
                            >
                                Add to favorites
                            </Menu.Item>

                            <AddToCollectionMenu recipe={r} />
                        </Menu.Dropdown>
                    </Menu>
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
