"use client";

import { MOCK_RECIPES } from "@/lib/mockRecipes";
import { Card, Badge, Group, Text, Stack, Divider } from "@mantine/core";
import { useEffect, useState } from "react";

export function RandomRecipeCard() {
    // const recipe =
    //     MOCK_RECIPES[Math.floor(Math.random() * MOCK_RECIPES.length)];

    const [recipe, setRecipe] = useState<any | null>(null);
    const [steps, setSteps] = useState<string[] | null>(null);

    useEffect(() => {
        const random =
            MOCK_RECIPES[Math.floor(Math.random() * MOCK_RECIPES.length)];
        setRecipe(random);
        setSteps(
            random.directions
                .split(". ")
                .map((s: any) => s.trim())
                .filter(Boolean)
        );
    }, []);

    if (!recipe) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400">
                Loading recipe…
            </div>
        );
    }

    return (
        <Card
            radius="lg"
            shadow="md"
            padding="lg"
            className="w-full h-full flex flex-col justify-between"
        >
            {/* Header */}
            <Stack gap={24}>
                <Text fw={700} size="xl" fz="h2">
                    {recipe.title}
                </Text>

                <Group gap="xs">
                    <Badge color="orange" variant="light">
                        {recipe.cuisine}
                    </Badge>
                    <Badge color="blue" variant="light">
                        {recipe.category}
                    </Badge>
                    <Badge color="grape" variant="light">
                        {recipe.meal_type}
                    </Badge>
                </Group>
            </Stack>

            <Divider />

            {/* Description */}
            <Text c="dimmed" lineClamp={3}>
                {recipe.description}
            </Text>

            {/* Ingredients */}
            <Text mt="sm" fw={600}>
                Ingredients ({recipe.ingredients.length})
            </Text>
            <Text size="sm" c="dimmed">
                {recipe.ingredients
                    .slice(0, 4)
                    .map((i: any) => i.name)
                    .join(", ")}
                {recipe.ingredients.length > 4 && "…"}
            </Text>

            {/* Directions (split into steps) */}
            <Stack gap={6} mt="sm">
                <Text fw={600}>Directions</Text>

                {steps?.slice(0, 3).map((step, i) => (
                    <Text key={i} size="sm" c="dimmed">
                        <strong>Step {i + 1}:</strong> {step}.
                    </Text>
                ))}

                {steps && (steps.length > 3 && (
                    <Text size="xs" c="gray">
                        + {steps.length - 3} more steps
                    </Text>)
                )}
            </Stack>

            {/* Footer */}
            <Group mt="md" gap="xs">
                {recipe.is_vegan && (
                    <Badge color="green" variant="outline">
                        Vegan
                    </Badge>
                )}
                {recipe.is_vegetarian && (
                    <Badge color="teal" variant="outline">
                        Vegetarian
                    </Badge>
                )}
            </Group>
        </Card>
    );
}
