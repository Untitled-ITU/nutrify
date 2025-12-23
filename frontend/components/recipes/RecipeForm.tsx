"use client";

import {
    TextInput,
    Textarea,
    Checkbox,
    Button,
    Stack,
    Grid,
    Paper,
    Divider,
    Select,
    Text,
    useMantineTheme,
} from "@mantine/core";
import { IngredientEditor } from "@/components/recipes/IngredientEditor";
import { IngredientRow } from "@/components/recipes/IngredientEditor";

export type RecipeFormData = {
    title: string;
    description: string;
    directions: string;
    ingredients: IngredientRow[];
    category: string;
    cuisine: string;
    meal_type: string;
    is_vegan: boolean;
    is_vegetarian: boolean;
};

type Filters = {
    categories: string[];
    cuisines: string[];
    meal_types: string[];
};

type Props = {
    value: RecipeFormData;
    onChange: (value: RecipeFormData) => void;
    filters: Filters | null;
    loading: boolean;
    submitLabel: string;
    onSubmit: () => void;
};

export function RecipeForm({
    value,
    onChange,
    filters,
    loading,
    submitLabel,
    onSubmit,
}: Props) {
    const theme = useMantineTheme();

    function update<K extends keyof RecipeFormData>(
        key: K,
        val: RecipeFormData[K]
    ) {
        onChange({ ...value, [key]: val });
    }

    return (
        <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 8 }}>
                <Paper withBorder p="lg" radius="md">
                    <Stack>
                        <TextInput
                            label="Title"
                            required
                            value={value.title}
                            onChange={(e) =>
                                update("title", e.target.value)
                            }
                        />

                        <Textarea
                            label="Description"
                            value={value.description}
                            onChange={(e) =>
                                update("description", e.target.value)
                            }
                        />

                        <Divider />

                        <Textarea
                            label="Directions"
                            minRows={8}
                            autosize
                            value={value.directions}
                            onChange={(e) =>
                                update("directions", e.target.value)
                            }
                        />

                        <IngredientEditor
                            value={value.ingredients}
                            onChange={(ingredients) =>
                                update("ingredients", ingredients)
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
                                value={value.category}
                                onChange={(v) =>
                                    update("category", v || "")
                                }
                            />
                            <Select
                                label="Cuisine"
                                data={filters.cuisines}
                                value={value.cuisine}
                                onChange={(v) =>
                                    update("cuisine", v || "")
                                }
                            />
                            <Select
                                label="Meal type"
                                data={filters.meal_types}
                                value={value.meal_type}
                                onChange={(v) =>
                                    update("meal_type", v || "")
                                }
                            />

                            <Divider />

                            <Checkbox
                                label="Vegan"
                                checked={value.is_vegan}
                                onChange={(e) =>
                                    update(
                                        "is_vegan",
                                        e.currentTarget.checked
                                    )
                                }
                            />
                            <Checkbox
                                label="Vegetarian"
                                checked={value.is_vegetarian}
                                onChange={(e) =>
                                    update(
                                        "is_vegetarian",
                                        e.currentTarget.checked
                                    )
                                }
                            />

                            <Divider />

                            <Button
                                fullWidth
                                loading={loading}
                                onClick={onSubmit}
                                style={{
                                    backgroundColor:
                                        theme.other.accentColor,
                                }}
                            >
                                {submitLabel}
                            </Button>
                        </Stack>
                    )}
                </Paper>
            </Grid.Col>
        </Grid>
    );
}
