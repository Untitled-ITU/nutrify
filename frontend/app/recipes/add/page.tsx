"use client";

import { useEffect, useState } from "react";
import {
    TextInput,
    Textarea,
    Checkbox,
    Button,
    Stack,
    Group,
    Title,
    Grid,
    Paper,
    Divider,
    Select,
    Text,
    useMantineTheme,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { authFetch } from "@/app/providers/AuthProvider";
import { notifications } from "@mantine/notifications";
import { API_BASE_URL } from "@/lib/config";
import { IngredientEditor, IngredientRow } from "@/components/recipes/IngredientEditor";

type Filters = {
    categories: string[];
    cuisines: string[];
    meal_types: string[];
};

export default function NewRecipePage() {
    const router = useRouter();
    const theme = useMantineTheme();
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<Filters | null>(null);

    const [form, setForm] = useState({
        title: "",
        description: "",
        directions: "",
        ingredients: [] as IngredientRow[],
        category: "",
        cuisine: "",
        meal_type: "",
        is_vegan: false,
        is_vegetarian: false,
    });

    useEffect(() => {
        async function loadFilters() {
            const res = await authFetch(API_BASE_URL + "/api/recipes/filters");
            setFilters(await res.json());
        }
        loadFilters();
    }, []);

    function updateField<K extends keyof typeof form>(
        key: K,
        value: typeof form[K]
    ) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSubmit() {
        setLoading(true);

        try {
            const res = await authFetch(API_BASE_URL + "/api/chef/recipes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description || null,
                    directions: form.directions || null,
                    category: form.category || null,
                    cuisine: form.cuisine || null,
                    meal_type: form.meal_type || null,
                    is_vegan: form.is_vegan,
                    is_vegetarian: form.is_vegetarian,
                    ingredients: form.ingredients.filter(
                        (i) => i.name !== null
                    ),
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                console.error(err);
                throw new Error();
            }

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
        <Stack className="w-full px-4">
            <h1 className="text-4xl font-bold mb-8">Create New Recipe</h1>

            <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Paper withBorder p="lg" radius="md">
                        <Stack>
                            <TextInput
                                label="Title"
                                required
                                value={form.title}
                                onChange={(e) =>
                                    updateField("title", e.target.value)
                                }
                            />

                            <Textarea
                                label="Description"
                                value={form.description}
                                onChange={(e) =>
                                    updateField("description", e.target.value)
                                }
                            />

                            <Divider />

                            <Textarea
                                label="Directions"
                                minRows={8}
                                autosize
                                value={form.directions}
                                onChange={(e) =>
                                    updateField("directions", e.target.value)
                                }
                            />

                            <IngredientEditor
                                value={form.ingredients}
                                onChange={(ingredients) =>
                                    updateField("ingredients", ingredients)
                                }
                            />
                        </Stack>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper withBorder p="lg" radius="md">
                        {!filters ? (
                            <Text c="dimmed">Loading filters…</Text>
                        ) : (
                            <Stack>
                                <Select
                                    label="Category"
                                    data={filters.categories}
                                    value={form.category}
                                    onChange={(v) =>
                                        updateField("category", v || "")
                                    }
                                />
                                <Select
                                    label="Cuisine"
                                    data={filters.cuisines}
                                    value={form.cuisine}
                                    onChange={(v) =>
                                        updateField("cuisine", v || "")
                                    }
                                />
                                <Select
                                    label="Meal type"
                                    data={filters.meal_types}
                                    value={form.meal_type}
                                    onChange={(v) =>
                                        updateField("meal_type", v || "")
                                    }
                                />

                                <Divider />

                                <Checkbox
                                    label="Vegan"
                                    checked={form.is_vegan}
                                    onChange={(e) =>
                                        updateField(
                                            "is_vegan",
                                            e.currentTarget.checked
                                        )
                                    }
                                />

                                <Checkbox
                                    label="Vegetarian"
                                    checked={form.is_vegetarian}
                                    onChange={(e) =>
                                        updateField(
                                            "is_vegetarian",
                                            e.currentTarget.checked
                                        )
                                    }
                                />

                                <Divider />

                                <Button
                                    fullWidth
                                    loading={loading}
                                    onClick={handleSubmit}
                                    style={{
                                        backgroundColor:
                                            theme.other.accentColor,
                                    }}
                                >
                                    Create Recipe
                                </Button>
                            </Stack>
                        )}
                    </Paper>
                </Grid.Col>
            </Grid>
        </Stack>
    );
}
