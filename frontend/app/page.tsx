"use client";

import Link from "next/link";
import { RandomRecipeCard } from "@/components/recipes/RandomRecipeCard";
import { Container, Grid, Box, useMantineTheme, Button, Stack } from "@mantine/core";
import { useAuth } from "./providers/AuthProvider";
import {
  IconBowlSpoon,
  IconChefHat,
  IconPlant,
  IconCompass,
  IconHeart,
  IconFolder,
} from "@tabler/icons-react";


export default function Home() {
  const theme = useMantineTheme();
  const { user } = useAuth();

  const accent = theme.other.accentColor;
  const leafGreen = theme.colors.green?.[6] ?? "green";

  const outlineBtnStyles = {
    root: {
      width: "60%",
      borderColor: accent,
      color: accent,
    },
    inner: { justifyContent: "flex-start" },
  } as const;

  const filledBtnStyles = {
    root: {
      width: "60%",
      backgroundColor: accent,
      border: `1px solid ${accent}`,
    },
    inner: { justifyContent: "flex-start" },
  } as const;

  return (
    <Container className="w-full" size="xl" py="xl">
      <Grid align="center">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <div className="flex flex-col gap-4">
            {/* Title row: leaf left + symmetric spacing */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
              <div className="hidden sm:flex w-24 justify-center">
                <img className="w-24 ms-16" src="/foodIcon-green.png" alt="Nutrify logo" />
              </div>

              <h1 className="text-6xl font-bold leading-tight">
                Welcome to <br /> Nutrify!
              </h1>

              {/* symmetric spacer (keeps visual balance) */}
              <div className="hidden sm:block w-24" aria-hidden="true" />
            </div>

            {user != null ? (
              <>
                <p className="mt-12 mb-6 text-3xl">Hi again {user.username}!</p>

                {/* Logged-in actions as buttons (icons + outline) */}
                <Stack gap="sm" className="mb-12">
                  <Button
                    component={Link}
                    href="/discover"
                    variant="outline"
                    radius="md"
                    leftSection={<IconCompass size={22} />}
                    styles={outlineBtnStyles}
                  >
                    Let&apos;s discover new recipes!
                  </Button>

                  <Button
                    component={Link}
                    href="/recipes/favorites"
                    variant="outline"
                    radius="md"
                    leftSection={<IconHeart size={22} />}
                    styles={outlineBtnStyles}
                  >
                    Check out your favorites!
                  </Button>

                  <Button
                    component={Link}
                    href="/recipes/collections"
                    variant="outline"
                    radius="md"
                    leftSection={<IconFolder size={22} />}
                    styles={outlineBtnStyles}
                  >
                    Visit your collections!
                  </Button>
                </Stack>
              </>
            ) : (
              <>
                <p className="mt-12 text-lg text-gray-700">
                  With Nutrify, you can discover thousands of recipes, organize your ingredients
                  and curate weekly meal plans.
                </p>

                {/* Keep your signup buttons but make them consistent Mantine buttons */}
                <Button
                  component={Link}
                  href="/auth/signup"
                  radius="md"
                  leftSection={<IconBowlSpoon size={26} />}
                  styles={filledBtnStyles}
                  className="mt-4"
                >
                  Sign up to get started!
                </Button>

                <h3 className="text-3xl font-semibold mt-8">As a Chef</h3>

                <p className="text-lg text-gray-700">
                  You can create your own recipes, organize your restaurant and discover new recipes
                  to get inspired.
                </p>

                <Button
                  component={Link}
                  href="/auth/signup?role=chef"
                  radius="md"
                  leftSection={<IconChefHat size={26} />}
                  styles={filledBtnStyles}
                  className="mt-4"
                >
                  Sign up as a Chef to start creating!
                </Button>
              </>
            )}
          </div>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Box
            className="shadow-2xl h-156 rounded-md bg-gray-100 flex items-center justify-center text-gray-500"
            style={{ backgroundColor: theme.other.contentBackground }}
          >
            <RandomRecipeCard />
          </Box>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
