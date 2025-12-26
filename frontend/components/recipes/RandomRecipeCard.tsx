"use client";

import { API_BASE_URL } from "@/lib/config";
import { Card, Badge, Group, Text, Stack } from "@mantine/core";
import { useEffect, useState } from "react";
import { Recipe } from "./types";

export function RandomRecipeCard() {

    const [recipe, setRecipe] = useState<any | null>(null);

    useEffect(() => {
        async function fetchRecipe() {
            const res = await fetch(`${API_BASE_URL}/api/recipes/random`);
            if (!res.ok) throw new Error("Failed to fetch random recipe");
            const random: Recipe = await res.json()
            setRecipe(random);
        }
        fetchRecipe();
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
            className="w-full h-full flex flex-col"
        >
            {/* Image header */}
            <Card.Section className="relative h-[80%]">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
          linear-gradient(
            to bottom,
            rgba(0,0,0,0.15),
            rgba(0,0,0,0.15)
          ),
          url(${recipe.image_url})
        `,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />

                <div className="relative z-10 p-4 h-full flex flex-col justify-end">
                    <h2 className="text-6xl text-white font-extrabold drop-shadow-[0_4px_4px_rgba(0,0,0,1)]" >
                        {recipe.title}
                    </h2>
                </div>
            </Card.Section>

            {/* Content */}
            <Stack gap="sm" mt="md" className="flex-1">
                <Group gap="xs" mt={4}>
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
                <Text size="sm" c="dimmed" lineClamp={3}>
                    {recipe.description}
                </Text>
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
