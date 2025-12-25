"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authFetch } from "@/app/providers/AuthProvider";
import { notifications } from "@mantine/notifications";
import { API_BASE_URL } from "@/lib/config";
import { RecipeForm, RecipeFormData } from "@/components/recipes/RecipeForm";

export default function EditRecipeClientPage() {
    const { id } = useParams();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState(null);
    const [form, setForm] = useState<RecipeFormData | null>(null);

    useEffect(() => {
        async function load() {
            const [recipeRes, filterRes] = await Promise.all([
                authFetch(`${API_BASE_URL}/api/recipes/${id}`),
                authFetch(`${API_BASE_URL}/api/recipes/filters`),
            ]);

            const recipe = await recipeRes.json();
            const filters = await filterRes.json();

            setFilters(filters);
            setForm({
                title: recipe.title,
                description: recipe.description ?? "",
                directions: recipe.directions ?? "",
                ingredients: recipe.ingredients.map((i: any) => ({
                    ingredient_id: i.id,
                    name: i.name,
                    quantity: i.quantity,
                    unit: i.unit,
                })),
                category: recipe.category ?? "",
                cuisine: recipe.cuisine ?? "",
                meal_type: recipe.meal_type ?? "",
                is_vegan: recipe.is_vegan,
                is_vegetarian: recipe.is_vegetarian,
            });
        }

        load();
    }, [id]);

    async function handleSubmit() {
        if (!form) return;
        setLoading(true);

        try {
            const res = await authFetch(
                `${API_BASE_URL}/api/chef/recipes/${id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...form,
                        description: form.description || null,
                        directions: form.directions || null,
                        category: form.category || null,
                        cuisine: form.cuisine || null,
                        meal_type: form.meal_type || null,
                        ingredients: form.ingredients.filter(
                            (i) => i.name
                        ),
                    }),
                }
            );

            if (!res.ok) throw new Error();

            notifications.show({
                title: "Recipe updated",
                message: "Changes saved",
                color: "green",
            });

            router.push(`/recipes/details/${id}`);
        } catch {
            notifications.show({
                title: "Error",
                message: "Failed to update recipe",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    }

    if (!form) return null;

    return (
        <div className="w-full px-4">
            <h1 className="text-4xl font-bold mb-8">
                Edit Recipe
            </h1>

            <RecipeForm
                value={form}
                onChange={setForm}
                filters={filters}
                loading={loading}
                submitLabel="Save Changes"
                onSubmit={handleSubmit}
            />
        </div>
    );
}
