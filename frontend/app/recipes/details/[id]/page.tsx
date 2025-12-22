"use client"

import { authFetch } from "@/app/providers/AuthProvider";
import { AddToCollectionMenu } from "@/components/recipes/AddToCollectionMenu";
import { mapRecipeDetailsToRecipe, Recipe, RecipeDetails } from "@/components/recipes/types";
import { API_BASE_URL } from "@/lib/config";
import { handleAddFavorite, handleRemoveFavorite, removeFavorite } from "@/lib/tableActions";
import { ActionIcon, Button, Divider, Menu, useMantineTheme } from "@mantine/core";
import { IconHeart, IconPlus, IconX } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const EMPTY_RECIPE: RecipeDetails = {
    id: 0,
    title: "",
    description: "",
    directions: "",
    cuisine: "",
    category: "",
    meal_type: "",
    created_at: "",
    ingredients: [],
    is_vegan: false,
    is_vegetarian: false,
};

export default function RecipeDetailsPage() {
    const params = useParams();
    const recipeId = params?.id;
    const [recipe, setRecipe] = useState<RecipeDetails>(EMPTY_RECIPE);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const theme = useMantineTheme();

    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

    useEffect(() => {
        if (!recipeId) return;
        const fetchRecipe = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await authFetch(`${API_BASE_URL}/api/recipes/${recipeId}`);
                if (!res.ok) throw new Error("Failed to fetch collection");
                const data: RecipeDetails = await res.json();
                setRecipe(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchRecipe();
    }, [recipeId]);

    useEffect(() => {
        if (!recipeId) return;

        const checkFavorite = async () => {
            try {
                const res = await authFetch(`${API_BASE_URL}/api/recipes/favorites`);
                if (!res.ok) throw new Error();

                const favorites: { favorites: Recipe[] } = await res.json();

                setIsFavorite(
                    favorites.favorites.some((f) => Number(f.id) === Number(recipeId))
                );
                console.log(favorites.favorites);
                console.log(isFavorite, recipeId);
            } catch {
                // silently fail
            }
        };

        checkFavorite();
    }, [recipeId]);

    const toggleFavorite = async () => {
        setFavoriteLoading(true);

        try {
            if (isFavorite) {
                await handleRemoveFavorite(mapRecipeDetailsToRecipe(recipe));
            } else {
                await handleAddFavorite(mapRecipeDetailsToRecipe(recipe));
            }

            setIsFavorite((prev) => !prev);
        } catch {
            // optional notification
        } finally {
            setFavoriteLoading(false);
        }
    };

    const steps = recipe?.directions
        .split(". ")
        .map(s => s.trim() + (s.slice(-1) == "." ? "" : "."));

    return (
        <div className="w-full mx-auto px-4 py-10 space-y-12">
            {/* Top section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left */}
                <div>
                    <h1 className="text-4xl font-bold mb-8">
                        {recipe?.title}
                    </h1>
                    <div className="flex flex-wrap items-start gap-10">
                        <div>
                            <div className="font-semibold">Cuisine</div>
                            <div className="text-gray-600 capitalize">
                                {recipe?.cuisine}
                            </div>
                        </div>

                        <div>
                            <div className="font-semibold">Category</div>
                            <div className="text-gray-600 capitalize">
                                {recipe?.category}
                            </div>
                        </div>

                        <div>
                            <div className="font-semibold">Added On</div>
                            <div className="text-gray-600">
                                {recipe && (new Date(recipe.created_at).toLocaleDateString())}
                            </div>
                        </div>

                        <div className="flex flex-col items-end justify-end gap-3 ml-auto">
                            <Button
                                leftSection={isFavorite ? <IconX size={18} /> : <IconHeart size={18} />}
                                loading={favoriteLoading}
                                style={{
                                    backgroundColor: theme.other.accentColor,
                                }}
                                onClick={toggleFavorite}
                            >
                                {isFavorite ? "Remove from favorites" : "Add to favorites"}
                            </Button>
                            <AddToCollectionMenu variant="button" recipe={mapRecipeDetailsToRecipe(recipe)} />
                        </div>
                    </div>
                    <h4 className="text-xl font-bold mt-8 mb-4">Description</h4>
                    <p className="text-gray-600 leading-relaxed">
                        {recipe?.description}
                    </p>
                </div>

                {/* Right (image placeholder) */}
                <div className="rounded-2xl overflow-hidden bg-gray-200 aspect-4/3" />
            </div>

            {/* Meta info */}

            <div className="flex flex-row gap-4">
                {/* Ingredients */}
                <section className="flex-1">
                    <h2 className="text-2xl font-bold mb-8">
                        Ingredients
                    </h2>

                    <ul className="gap-x-6 gap-y-8 grid grid-cols-2 text-gray-600">
                        {recipe.ingredients.map((ing) => (
                            <li key={ing.id}>
                                &gt; <span className="capitalize">{ing.name}</span> ,{" "}
                                {ing.quantity} {ing.unit}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Instructions */}
                <section className="space-y-8 flex-1">
                    <h2 className="text-2xl font-bold">
                        Instructions
                    </h2>
                    {steps?.map((step, index) => (
                        <div
                            key={index}
                            // className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 items-start"
                            className="flex flex-col items-start"
                        >
                            {/* Step image placeholder 
                    <div className="rounded-2xl bg-gray-200 aspect-4/3" />
                    */}

                            {/* Step text */}
                            <div className="flex flex-row w-full">
                                <h3 className="flex-1 font-semibold mb-2">
                                    Step {index + 1}
                                </h3>
                                <p className="flex-10 text-gray-600 leading-relaxed">
                                    {step}
                                </p>
                            </div>
                        </div>
                    ))}
                </section>
            </div>
        </div>
    );
}
