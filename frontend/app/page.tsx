"use client";

import { RandomRecipeCard } from "@/components/recipes/RandomRecipeCard";
import { Container, Grid, Box, useMantineTheme } from "@mantine/core";
import { useAuth } from "./providers/AuthProvider";

export default function Home() {
    const theme = useMantineTheme();
    const { user } = useAuth();

    return (
        <Container className="w-full" size="xl" py="xl">
            <Grid align="center">
                {/* Left Column - Text */}
                <Grid.Col span={{ base: 12, md: 7 }}>
                    <div className="flex flex-col gap-4">
                        <h1 className="text-6xl font-bold">
                            Welcome to <br /> Nutrify!
                        </h1>

                        {user != null ? (<>
                                <p className="mt-12 mb-12 text-3xl">
                                    Hi again {user.username}! 
                                </p>
                                <a href="/discover" className="text-lg">
                                    Let's discover new recipes!
                                </a>
                                <a href="/recipes/favorites" className="text-lg">
                                    Or you can check out your favorites!
                                </a>
                                <a href="/recipes/collections" className="text-lg">
                                    Or your collections!
                                </a>
                        </>) : (
                            <>
                                <p className="mt-12 text-lg text-gray-500">
                                    With Nutrify, you can discover thousands of recipes, organize your
                                    ingredients and curate weekly meal plans.
                                </p>

                                <a href="/auth/signup" className="text-lg">
                                    Sign up to get started.
                                </a>

                                <h3 className="text-3xl font-semibold mt-8">
                                    As a Chef
                                </h3>

                                <p className="text-gray-500">
                                    You can create your own recipes, organize your restaurant and
                                    discover new recipes to get inspired.
                                </p>

                                <a href="/auth/signup">
                                    Sign up as a Chef to get started.
                                </a>
                            </>
                        )
                        }
                    </div>
                </Grid.Col>

                {/* Right Column - Box Placeholder */}
                <Grid.Col span={{ base: 12, md: 5 }}>
                    <Box
                        className="shadow-2xl h-156 border-2 border-dashed border-gray-400 rounded-md bg-gray-100 flex items-center justify-center text-gray-500"
style={{ backgroundColor: theme.other.contentBackground }}
                    >
                        <RandomRecipeCard />
                    </Box>
                </Grid.Col>
            </Grid>
        </Container>
    );
}
