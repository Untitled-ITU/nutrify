"use client";

import { Modal, Group, ActionIcon, useMantineTheme } from "@mantine/core";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { RecipeExplorer } from "@/components/recipes/RecipeExplorer";
import { Collection, Recipe } from "@/components/recipes/types";
import { authFetch } from "@/app/providers/AuthProvider";
import { API_BASE_URL } from "@/lib/config";
import { Button } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { AddToPlanButton } from "@/components/meal-plan/AddToPlanButton";

export default function CollectionDetailClientPage() {
    const params = useParams();
    const collectionId = params?.id;
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [collection, setCollection] = useState<Collection | null>(null);

    const [removeOpen, setRemoveOpen] = useState(false);
    const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
    const [removeLoading, setRemoveLoading] = useState(false);

    const theme = useMantineTheme();

    useEffect(() => {
        if (!collectionId) return;
        const fetchRecipes = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await authFetch(`${API_BASE_URL}/api/recipes/collections/${collectionId}`);
                if (!res.ok) throw new Error("Failed to fetch collection");

                const data: Collection = await res.json();
                setCollection(data);
                const mapped: Recipe[] = data.recipes.map((r: any) => ({
                    id: r.recipe_id,
                    title: r.recipe_title,
                    cuisine: r.recipe_cuisine,
                    category: r.recipe_category,
                    description: r.recipe_description,
                    average_rating: r.average_rating ?? 0,
                    rating_count: r.rating_count ?? 0,
                    created_at: r.added_at,
                    num_ingredients: r.num_ingredients ?? 0,
                }));
                setRecipes(mapped);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchRecipes();
    }, [collectionId]);

    async function removeRecipeFromCollection() {
        if (!collectionId || !selectedRecipeId) return;

        setRemoveLoading(true);

        try {
            await authFetch(
                `${API_BASE_URL}/api/recipes/collections/${collectionId}/recipes/${selectedRecipeId}`,
                { method: "DELETE" }
            );

            // update UI without refetch
            setRecipes((prev) =>
                prev.filter((r) => r.id !== selectedRecipeId)
            );

            setRemoveOpen(false);
            setSelectedRecipeId(null);
        } catch {
            alert("Failed to remove recipe from collection");
        } finally {
            setRemoveLoading(false);
        }
    }

    return (
        <div className="w-full px-4">
            <h1 className="text-4xl font-bold mb-8">{collection?.name}</h1>
            <p className="text-xl font-medium mb-8">{collection?.description}</p>

            {loading && <div>Loading...</div>}
            {error && <div className="text-red-500">{error}</div>}
            {!loading && !error && (
                <RecipeExplorer recipes={recipes}
                    onFiltersChangeAction={() => { }}
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
                                onClick={() => {
                                    setSelectedRecipeId(r.id);
                                    setRemoveOpen(true);
                                }}
                            >
                                <IconX size={18} />
                            </ActionIcon>
                        </>
                    )}

                />
            )}

            <Modal
                opened={removeOpen}
                onClose={() => setRemoveOpen(false)}
                title="Remove recipe from collection"
                centered
            >
                <p>
                    Are you sure you want to remove this recipe from the collection?
                    This will not delete the recipe itself.
                </p>

                <Group justify="flex-end" mt="md">
                    <Button
                        variant="default"
                        onClick={() => setRemoveOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        style={{ backgroundColor: theme.other.primaryDark }}
                        loading={removeLoading}
                        onClick={removeRecipeFromCollection}
                    >
                        Remove
                    </Button>
                </Group>
            </Modal>
        </div>
    );
}
