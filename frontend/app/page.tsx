"use client";

import { Container, Grid, Box } from "@mantine/core";

export default function Home() {
  return (
    <Container className="w-full" size="xl" py="xl">
      <Grid align="center">
        {/* Left Column - Text */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <div className="flex flex-col gap-4">
            <h1 className="text-6xl font-bold">
              Welcome to <br /> Nutrify!
            </h1>

            <p className="mt-12 text-lg text-gray-500">
              With Nutrify, you can discover thousands of recipes, organize your
              ingredients and curate weekly meal plans.
            </p>

            <p className="text-lg">
              Sign up to get started.
            </p>

            <h3 className="text-3xl font-semibold mt-8">
              As a Chef
            </h3>

            <p className="text-gray-500">
              You can create your own recipes, organize your restaurant and
              discover new recipes to get inspired.
            </p>

            <p>
              Sign up as a Chef to get started.
            </p>
          </div>
        </Grid.Col>

        {/* Right Column - Box Placeholder */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Box
            className="h-156 border-2 border-dashed border-gray-400 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 text-center"
          >
            A random recipe will be here
          </Box>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
