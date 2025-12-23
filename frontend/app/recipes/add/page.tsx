"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/app/providers/AuthProvider";
import { notifications } from "@mantine/notifications";
import { API_BASE_URL } from "@/lib/config";
import { RecipeForm, RecipeFormData } from "@/components/recipes/RecipeForm";

export default function NewRecipePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState(null);

    const [form, setForm] = useState<RecipeFormData>({
        title: "",
        description: "",
        directions: "",
        ingredients: [],
        category: "",
        cuisine: "",
        meal_type: "",
        is_vegan: false,
        is_vegetarian: false,
    });

    useEffect(() => {
        authFetch(API_BASE_URL + "/api/recipes/filters")
            .then((r) => r.json())
            .then(setFilters);
    }, []);

    async function handleSubmit() {
        setLoading(true);
        try {
            const res = await authFetch(API_BASE_URL + "/api/chef/recipes", {
                method: "POST",
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
            });

            if (!res.ok) throw new Error();

            notifications.show({
                title: "Recipe created",
                message: "Your recipe was saved",
                color: "green",
            });

            router.push("/discover");
        } catch {
            notifications.show({
                title: "Error",
                message: "Failed to create recipe",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full px-4">
            <h1 className="text-4xl font-bold mb-8">
                Create New Recipe
            </h1>

            <RecipeForm
                value={form}
                onChange={setForm}
                filters={filters}
                loading={loading}
                submitLabel="Create Recipe"
                onSubmit={handleSubmit}
            />
        </div>
    );
}
