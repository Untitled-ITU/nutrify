"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconChefHat, IconEdit, IconPlus, IconTrash, IconX } from "@tabler/icons-react";

import {
  ChefRecipeSummary,
  ChefPublicProfile,
  Profile,
  fetchProfile,
  fetchChefPublicProfile,
  deleteChefRecipe,
} from "@/lib/chef";

/** Defensive: ensure external absolute URL even if old data exists */
function toExternalUrl(raw?: string | null) {
  const v = (raw ?? "").trim();
  if (!v) return null;

  // already absolute http(s)
  if (/^https?:\/\//i.test(v)) return v;

  // block dangerous schemes
  if (/^(javascript|data):/i.test(v)) return null;

  // treat plain domain as external
  return `https://${v}`;
}

export async function generateStaticParams() {
  return [];
}

export default function ChefProfilePage() {
  const theme = useMantineTheme();
  const params = useParams<{ chefId: string }>();
  const router = useRouter();

  const chefId = Number(params.chefId);

  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<Profile | null>(null);
  const [chef, setChef] = useState<ChefPublicProfile | null>(null);
  const [recipes, setRecipes] = useState<ChefRecipeSummary[]>([]);

  // delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ChefRecipeSummary | null>(null);

  // ONLY account owner sees buttons
  const isOwner = useMemo(() => {
    if (!viewer || !Number.isFinite(chefId)) return false;
    return viewer.id === chefId;
  }, [viewer, chefId]);

  const BRAND = (theme.other?.primaryDark as string) ?? "#896C6C";
  const SOFT_BG = (theme.other?.contentBackground as string) ?? "#F3E7E5";

  const filledBtnStyles = {
    root: { backgroundColor: BRAND, color: "white" },
  };

  const outlineBtnStyles = {
    root: { borderColor: BRAND, color: BRAND, backgroundColor: "transparent" },
  };

  useEffect(() => {
    if (!Number.isFinite(chefId)) {
      router.replace("/discover");
      return;
    }

    (async () => {
      try {
        setLoading(true);

        // viewer is optional
        try {
          const v = await fetchProfile();
          setViewer(v);
        } catch {
          setViewer(null);
        }

        // public chef data (endpoint returns recipes inside too)
        const chefProfile = await fetchChefPublicProfile(chefId);
        setChef(chefProfile);
        setRecipes(chefProfile.recipes ?? []);
      } catch {
        notifications.show({
          title: "Failed to load chef profile",
          message: "Please try again.",
          color: "red",
          icon: <IconX size={18} />,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [chefId, router]);

  function openDelete(r: ChefRecipeSummary) {
    setPendingDelete(r);
    setDeleteOpen(true);
  }

  async function confirmDeleteRecipe() {
    if (!pendingDelete) return;

    setDeleteLoading(true);
    try {
      await deleteChefRecipe(pendingDelete.id);

      notifications.show({
        title: "Deleted",
        message: `"${pendingDelete.title}" deleted successfully.`,
        color: "green",
      });

      setRecipes((prev) => prev.filter((x) => x.id !== pendingDelete.id));
      setDeleteOpen(false);
      setPendingDelete(null);
    } catch {
      notifications.show({
        title: "Delete failed",
        message: "Could not delete recipe.",
        color: "red",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <Loader />
      </div>
    );
  }

  if (!chef) {
    return (
      <div className="w-full">
        <Text c="dimmed">Chef not found.</Text>
      </div>
    );
  }

  const websiteHref = toExternalUrl(chef.website);

  return (
    <Stack className="w-full" gap="lg">
      {/* Header */}
      <Paper radius="md" p="lg" withBorder style={{ background: SOFT_BG }}>
        <Group justify="space-between" align="center" wrap="wrap">
          <Group>
            <Avatar radius="xl" size={72} src={chef.avatar_url ?? undefined} />
            <div>
              <Group gap="sm">
                <Title order={2} style={{ color: BRAND }}>
                  {chef.username}
                </Title>
                <Badge
                  leftSection={<IconChefHat size={14} />}
                  variant="light"
                  styles={{ root: { borderColor: BRAND, color: BRAND } }}
                >
                  Chef
                </Badge>
              </Group>

              {chef.location ? (
                <Text size="sm" c="dimmed">
                  {chef.location}
                </Text>
              ) : null}

              {/* ✅ external link fix */}
              {websiteHref ? (
                <Text size="sm">
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: BRAND, textDecoration: "underline" }}
                  >
                    {chef.website}
                  </a>
                </Text>
              ) : null}
            </div>
          </Group>

          {/* OWNER-ONLY ACTIONS */}
          {isOwner ? (
            <Group>
              <Button
                styles={filledBtnStyles}
                component={Link}
                href="/recipes/add"
                leftSection={<IconPlus size={16} />}
              >
                Add Recipe
              </Button>

              <Button
                variant="outline"
                styles={outlineBtnStyles}
                component={Link}
                href="/profile"
              >
                Edit Profile
              </Button>
            </Group>
          ) : null}
        </Group>
      </Paper>

      {/* About */}
      <Card withBorder radius="md" p="lg">
        <Title order={4} style={{ color: BRAND }}>
          About
        </Title>
        <Text c="dimmed" mt="xs">
          {chef.bio?.trim() ? chef.bio : "This chef has not added a bio yet."}
        </Text>
      </Card>

      {/* Recipes */}
      <Card withBorder radius="md" p="lg">
        <Title order={4} style={{ color: BRAND }}>
          Recipes
        </Title>

        <Divider my="md" />

        <Stack gap="sm">
          {recipes.length === 0 ? (
            <Text c="dimmed">No recipes yet.</Text>
          ) : (
            recipes.map((r) => (
              <Paper key={r.id} withBorder radius="md" p="md">
                <Group justify="space-between" align="flex-start" wrap="wrap">
                  <div>
                    <Text fw={700}>
                      <Link
                        href={`/recipes/details/${r.id}`}
                        style={{ color: BRAND, textDecoration: "none" }}
                      >
                        {r.title}
                      </Link>
                    </Text>

                    {r.description ? (
                      <Text c="dimmed" size="sm" mt={4}>
                        {r.description}
                      </Text>
                    ) : null}

                    <Group gap="md" mt="sm">
                      <Text size="sm" c="dimmed">
                        Rating: <b>{r.average_rating ?? "—"}</b> ({r.rating_count})
                      </Text>
                      <Text size="sm" c="dimmed">
                        Ingredients: <b>{r.num_ingredients ?? "—"}</b>
                      </Text>
                      {r.category ? <Badge variant="light">{r.category}</Badge> : null}
                      {r.cuisine ? <Badge variant="light">{r.cuisine}</Badge> : null}
                    </Group>
                  </div>

                  {/* OWNER-ONLY EDIT/DELETE */}
                  {isOwner ? (
                    <Group gap="xs">
                      <Button
                        variant="outline"
                        styles={outlineBtnStyles}
                        component={Link}
                        href={`/recipes/edit/${r.id}`}
                        leftSection={<IconEdit size={16} />}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="light"
                        color="red"
                        leftSection={<IconTrash size={16} />}
                        onClick={() => openDelete(r)}
                      >
                        Delete
                      </Button>
                    </Group>
                  ) : null}
                </Group>
              </Paper>
            ))
          )}
        </Stack>
      </Card>

      {/* Delete modal */}
      <Modal
        opened={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete recipe"
        centered
      >
        <Text size="sm" c="dimmed">
          Are you sure you want to delete this recipe? This action cannot be undone.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button
            variant="default"
            onClick={() => setDeleteOpen(false)}
            disabled={deleteLoading}
          >
            Cancel
          </Button>

          <Button
            style={{ backgroundColor: BRAND }}
            loading={deleteLoading}
            onClick={confirmDeleteRecipe}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
