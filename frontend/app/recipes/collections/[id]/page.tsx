"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { RecipeExplorer } from "@/components/recipes/RecipeExplorer";
import { Collection, Recipe } from "@/components/recipes/types";
import { authFetch } from "@/app/providers/AuthProvider";
import { API_BASE_URL } from "@/lib/config";

export default function CollectionDetailPage() {
    const params = useParams();
    const collectionId = params?.id;
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [collection, setCollection] = useState<Collection | null>(null);

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

    return (
        <div className="w-full px-4">
            <h1 className="text-4xl font-bold mb-8">{collection?.name}</h1>
            <p className="text-xl font-medium mb-8">{collection?.description}</p>

            {loading && <div>Loading...</div>}
            {error && <div className="text-red-500">{error}</div>}
            {!loading && !error && (
                <RecipeExplorer recipes={recipes} onFiltersChangeAction={() => { }} disableIngredientFilter={true} />
            )}
        </div>
    );
}
