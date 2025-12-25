"use client"

import { authFetch, useAuth } from "@/app/providers/AuthProvider";
import { AddToCollectionMenu } from "@/components/recipes/AddToCollectionMenu";
import { mapRecipeDetailsToRecipe, Recipe, RecipeDetails } from "@/components/recipes/types";
import { API_BASE_URL } from "@/lib/config";
import { handleAddFavorite, handleRemoveFavorite, removeFavorite } from "@/lib/tableActions";
import { ActionIcon, Badge, Button, Divider, Group, Image, Menu, useMantineTheme } from "@mantine/core";
import { IconEdit, IconHeart, IconHttpDelete, IconPlus, IconX } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Modal, Text } from "@mantine/core";
import { RecipeRating } from "@/components/ratings/RecipeRating";
import Link from "next/dist/client/link";
import { AddToPlanButton } from "@/components/meal-plan/AddToPlanButton";

const EMPTY_RECIPE: RecipeDetails = {
    author: {
        id: 0,
        username: "",
    },
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
    is_favorite: false,
    image_url: "",
};

export default function RecipeDetailsClientPage() {
    const params = useParams();
    const recipeId = params?.id;
    const [recipe, setRecipe] = useState<RecipeDetails>(EMPTY_RECIPE);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const theme = useMantineTheme();
    const { user } = useAuth();

    const [favoriteLoading, setFavoriteLoading] = useState(false);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);


    useEffect(() => {
        if (!recipeId) return;
        const fetchRecipe = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await authFetch(`${API_BASE_URL}/api/recipes/${recipeId}`);
                if (!res.ok) throw new Error("Failed to fetch collection");
                const data: RecipeDetails = await res.json();
                console.log(data);
                setRecipe(data);

            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchRecipe();
    }, [recipeId]);

    const toggleFavorite = async () => {
        setFavoriteLoading(true);

        try {
            if (recipe.is_favorite) {
                await handleRemoveFavorite(mapRecipeDetailsToRecipe(recipe));
            } else {
                await handleAddFavorite(mapRecipeDetailsToRecipe(recipe));
            }

            recipe.is_favorite = !recipe.is_favorite;
        } catch {
            // optional notification
        } finally {
            setFavoriteLoading(false);
        }
    };

    const steps = recipe?.directions
        .split(". ")
        .map(s => s.trim() + (s.slice(-1) == "." ? "" : "."));

    async function confirmDeleteRecipe() {
        if (!recipe.id) return;

        setDeleteLoading(true);

        try {
            const res = await authFetch(`${API_BASE_URL}/api/chef/recipes/${recipe.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to fetch collection");

            window.location.href = "/discover";
        } catch (err) {
            setError((err as Error).message);
            setDeleteLoading(false);
            alert("Failed to delete recipe");
        }
    }

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
                        <div className="flex flex-col">
                            <div className="mb-6">
                                <div className="font-semibold">Created By</div>
                                {recipe.author ? (
                                    <Text size="sm" c="dimmed">
                                        By{" "}
                                        <Text
                                            component={Link}
                                            href={`/chef-profile/${recipe.author.id}`}
                                            span
                                            fw={600}
                                            style={{ textDecoration: "underline" }}
                                        >
                                            {recipe.author.username}
                                        </Text>
                                    </Text>
                                ) : "admin"}
                            </div>
                            <div className="flex flex-row gap-10 mb-8">
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
                            </div>
                            <RecipeRating recipeId={recipe.id} />
                        </div>

                        <div className="flex flex-col items-end justify-end gap-3 ml-auto">
                            <Button
                                leftSection={recipe.is_favorite ? <IconX size={18} /> : <IconHeart size={18} />}
                                loading={favoriteLoading}
                                style={{
                                    backgroundColor: theme.other.accentColor,
                                }}
                                onClick={toggleFavorite}
                            >
                                {recipe.is_favorite ? "Remove from favorites" : "Add to favorites"}
                            </Button>
                            <AddToCollectionMenu variant="button" recipe={mapRecipeDetailsToRecipe(recipe)} />
                            <AddToPlanButton recipeId={recipe.id} recipeTitle={recipe.title} />
                            {recipe.author && user?.id === recipe.author.id && (
                                <>
                                    <Button
                                        style={{ backgroundColor: theme.other.accentColor }}
                                        leftSection={<IconX size={18} />}
                                        onClick={() => setDeleteOpen(true)}
                                    >
                                        Delete recipe
                                    </Button>
                                    <Button
                                        component="a"
                                        href={`/recipes/edit/${recipe.id}`}
                                        variant="outline"
                                        leftSection={<IconEdit size={18} />}
                                        style={{ borderColor: theme.other.accentColor, color: theme.other.accentColor }}
                                    >
                                        Edit recipe
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    <h4 className="text-xl font-bold mt-8 mb-4">Description</h4>
                    <p className="text-gray-600 leading-relaxed">
                        {recipe?.description}
                    </p>
                </div>

                {/* Right (image placeholder) */}
                <div className="rounded-2xl shadow-xl/50 border-2 overflow-hidden bg-gray-200 aspect-4/3" style={{ borderColor: theme.other.accentColor }}>
                    <img className="w-full h-full object-center object-cover" src={recipe.image_url ?? null} />
                </ div>
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
                            <div className="flex flex-row w-full items-center">
                                <Badge color="green" className="me-4" size="xl" circle>
                                    {index + 1}
                                </Badge>
                                <p color="green" className="align-baseline flex-9 text-gray-600 leading-relaxed">
                                    {step}
                                </p>
                            </div>
                        </div>
                    ))}
                </section>
            </div>

            <Modal
                opened={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                title="Delete recipe"
                centered
            >
                <Text size="sm" c="dimmed">
                    Are you sure you want to delete this recipe?
                    This action cannot be undone.
                </Text>

                <Group justify="flex-end" mt="md">
                    <Button
                        variant="default"
                        onClick={() => setDeleteOpen(false)}
                        disabled={deleteLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        style={{ backgroundColor: theme.other.primaryDark }}
                        loading={deleteLoading}
                        onClick={confirmDeleteRecipe}
                    >
                        Delete
                    </Button>
                </Group>
            </Modal>
        </div>
    );
}
