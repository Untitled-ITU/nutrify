"use client";

import { useEffect, useMemo, useState } from "react";
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
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  Switch,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconChefHat, IconPlus, IconTrash, IconEdit, IconCheck, IconX } from "@tabler/icons-react";

import {
  ChefRecipeSummary,
  ChefStats,
  CreateRecipePayload,
  fetchChefRecipes,
  fetchChefStats,
  fetchProfile,
  updateUsername,
  createChefRecipe,re
  updateChefRecipe,
  deleteChefRecipe,
} from "@/lib/chef";

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Paper radius="md" p="md" withBorder>
      <Text size="sm" c="dimmed">{label}</Text>
      <Text fw={700} size="xl">{value}</Text>
    </Paper>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchProfile>> | null>(null);

  const [stats, setStats] = useState<ChefStats | null>(null);
  const [recipes, setRecipes] = useState<ChefRecipeSummary[]>([]);
  const [busy, setBusy] = useState(false);

  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);

  const usernameForm = useForm({
    initialValues: { username: "" },
    validate: {
      username: (v) => (v.trim().length < 2 ? "Username must be at least 2 characters" : null),
    },
  });

  const recipeForm = useForm<CreateRecipePayload>({
    initialValues: {
      title: "",
      description: "",
      category: "",
      cuisine: "",
      meal_type: "",
      is_vegan: false,
      is_vegetarian: false,
      directions: "",
      ingredients: [],
    },
    validate: {
      title: (v) => (v.trim().length < 1 ? "Title is required" : null),
    },
  });

  const isChef = useMemo(() => profile?.role === "chef" || profile?.role === "admin", [profile]);

  async function reloadChefData() {
    const [s, r] = await Promise.all([fetchChefStats(), fetchChefRecipes()]);
    setStats(s);
    setRecipes(r.recipes);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const p = await fetchProfile();
        setProfile(p);
        usernameForm.setValues({ username: p.username });

        if (p.role === "chef" || p.role === "admin") {
          await reloadChefData();
        }
      } catch (e) {
        notifications.show({
          title: "Failed to load profile",
          message: "Please try again.",
          color: "red",
          icon: <IconX size={18} />,
        });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSaveUsername() {
    const valid = usernameForm.validate();
    if (valid.hasErrors) return;

    try {
      setBusy(true);
      const res = await updateUsername(usernameForm.values.username.trim());
      notifications.show({
        title: "Profile updated",
        message: res.msg,
        color: "green",
        icon: <IconCheck size={18} />,
      });
      // refresh profile label
      const p = await fetchProfile();
      setProfile(p);
    } catch {
      notifications.show({
        title: "Update failed",
        message: "Could not update username.",
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setBusy(false);
    }
  }

  function openCreateRecipe() {
    setEditingRecipeId(null);
    recipeForm.reset();
    setRecipeModalOpen(true);
  }

  function openEditRecipe(r: ChefRecipeSummary) {
    setEditingRecipeId(r.id);
    recipeForm.setValues({
      title: r.title ?? "",
      description: r.description ?? "",
      category: r.category ?? "",
      cuisine: r.cuisine ?? "",
      meal_type: "",
      is_vegan: false,
      is_vegetarian: false,
      directions: "",
      ingredients: [],
    });
    setRecipeModalOpen(true);
  }

  async function onSubmitRecipe() {
    const valid = recipeForm.validate();
    if (valid.hasErrors) return;

    try {
      setBusy(true);

      if (editingRecipeId) {
        await updateChefRecipe(editingRecipeId, recipeForm.values);
        notifications.show({
          title: "Recipe updated",
          message: "Your recipe was updated successfully.",
          color: "green",
          icon: <IconCheck size={18} />,
        });
      } else {
        await createChefRecipe(recipeForm.values);
        notifications.show({
          title: "Recipe created",
          message: "Your recipe was created successfully.",
          color: "green",
          icon: <IconCheck size={18} />,
        });
      }

      setRecipeModalOpen(false);
      await reloadChefData();
    } catch {
      notifications.show({
        title: "Operation failed",
        message: "Something went wrong. Please try again.",
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteRecipe(recipeId: number) {
    try {
      setBusy(true);
      await deleteChefRecipe(recipeId);
      notifications.show({
        title: "Deleted",
        message: "Recipe deleted successfully.",
        color: "green",
        icon: <IconCheck size={18} />,
      });
      await reloadChefData();
    } catch {
      notifications.show({
        title: "Delete failed",
        message: "Could not delete recipe.",
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <Loader />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full">
        <Text c="dimmed">Could not load profile.</Text>
      </div>
    );
  }

  return (
    <Stack className="w-full" gap="lg">
      {/* Header */}
      <Group align="center" justify="space-between" wrap="wrap">
        <Group>
          <Avatar radius="xl" size={72} />
          <div>
            <Group gap="sm">
              <Title order={2}>{profile.username}</Title>
              <Badge leftSection={<IconChefHat size={14} />} color={isChef ? "grape" : "gray"}>
                {isChef ? "Chef" : "User"}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed">{profile.email}</Text>
          </div>
        </Group>
      </Group>

      <Divider />

      {/* If NOT chef, we leave placeholder for Consumer profile (we’ll implement next) */}
      {!isChef ? (
        <Card withBorder radius="md" p="lg">
          <Title order={4}>Consumer Profile</Title>
          <Text c="dimmed" mt="xs">
            We’ll implement the consumer profile (meal list sharing only) next.
          </Text>
        </Card>
      ) : (
        <>
          {/* Account Settings */}
          <Card withBorder radius="md" p="lg">
            <Title order={4}>Account Settings</Title>
            <Text c="dimmed" size="sm" mt={4}>
              Update your basic profile information.
            </Text>

            <Group mt="md" align="end">
              <TextInput
                label="Username"
                placeholder="Your username"
                w={320}
                {...usernameForm.getInputProps("username")}
              />
              <Button loading={busy} onClick={onSaveUsername}>
                Save
              </Button>
            </Group>
          </Card>

          {/* Chef Stats */}
          <Card withBorder radius="md" p="lg">
            <Group justify="space-between" align="center">
              <Title order={4}>Chef Stats</Title>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 3 }} mt="md">
              <StatCard label="Total Recipes" value={stats?.total_recipes ?? "—"} />
              <StatCard label="Total Ratings" value={stats?.total_ratings ?? "—"} />
              <StatCard label="Average Rating" value={stats?.average_rating ?? "—"} />
            </SimpleGrid>

            {/* Category breakdown (simple list) */}
            <Stack gap={6} mt="md">
              <Text fw={600}>Recipes by Category</Text>
              {stats && Object.keys(stats.recipes_by_category).length > 0 ? (
                Object.entries(stats.recipes_by_category).map(([cat, count]) => (
                  <Group key={cat} justify="space-between">
                    <Text c="dimmed">{cat}</Text>
                    <Text fw={600}>{count}</Text>
                  </Group>
                ))
              ) : (
                <Text c="dimmed">No category data yet.</Text>
              )}
            </Stack>
          </Card>

          {/* My Recipes */}
          <Card withBorder radius="md" p="lg">
            <Group justify="space-between" align="center">
              <Title order={4}>My Recipes</Title>
              <Button leftSection={<IconPlus size={16} />} onClick={openCreateRecipe}>
                Create Recipe
              </Button>
            </Group>

            <Stack mt="md" gap="sm">
              {recipes.length === 0 ? (
                <Text c="dimmed">You haven’t created any recipes yet.</Text>
              ) : (
                recipes.map((r) => (
                  <Paper key={r.id} withBorder radius="md" p="md">
                    <Group justify="space-between" align="flex-start" wrap="wrap">
                      <div>
                        <Text fw={700}>{r.title}</Text>
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
                          {r.category ? (
                            <Badge variant="light">{r.category}</Badge>
                          ) : null}
                          {r.cuisine ? (
                            <Badge variant="light">{r.cuisine}</Badge>
                          ) : null}
                        </Group>
                      </div>

                      <Group gap="xs">
                        <Button
                          variant="light"
                          leftSection={<IconEdit size={16} />}
                          onClick={() => openEditRecipe(r)}
                        >
                          Edit
                        </Button>
                        <Button
                          color="red"
                          variant="light"
                          leftSection={<IconTrash size={16} />}
                          loading={busy}
                          onClick={() => onDeleteRecipe(r.id)}
                        >
                          Delete
                        </Button>
                      </Group>
                    </Group>
                  </Paper>
                ))
              )}
            </Stack>
          </Card>

          {/* Placeholder: Chef Bio/Links (needs backend additions) */}
          <Card withBorder radius="md" p="lg">
            <Title order={4}>Chef Public Profile</Title>
            <Text c="dimmed" size="sm" mt={4}>
              Bio + website/restaurant links are not supported by the backend yet.
              We’ll add a ChefProfile model + endpoints, then wire the UI here.
            </Text>
          </Card>
        </>
      )}

      {/* Create/Edit Recipe Modal */}
      <Modal
        opened={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        title={editingRecipeId ? "Edit Recipe" : "Create Recipe"}
        centered
        size="lg"
      >
        <Stack>
          <TextInput label="Title" placeholder="Recipe title" {...recipeForm.getInputProps("title")} />
          <Textarea
            label="Description"
            placeholder="Short description"
            autosize
            minRows={2}
            {...recipeForm.getInputProps("description")}
          />

          <Group grow>
            <TextInput label="Category" placeholder="e.g. Dessert" {...recipeForm.getInputProps("category")} />
            <TextInput label="Cuisine" placeholder="e.g. Italian" {...recipeForm.getInputProps("cuisine")} />
          </Group>

          <TextInput label="Meal Type" placeholder="e.g. dinner" {...recipeForm.getInputProps("meal_type")} />

          <Group>
            <Switch label="Vegan" {...recipeForm.getInputProps("is_vegan", { type: "checkbox" })} />
            <Switch label="Vegetarian" {...recipeForm.getInputProps("is_vegetarian", { type: "checkbox" })} />
          </Group>

          <Textarea
            label="Directions"
            placeholder="Step-by-step directions"
            autosize
            minRows={4}
            {...recipeForm.getInputProps("directions")}
          />

          <Divider />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRecipeModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={onSubmitRecipe}>
              {editingRecipeId ? "Save Changes" : "Create"}
            </Button>
          </Group>

          <Text size="xs" c="dimmed">
            Ingredients UI is intentionally omitted for the first pass (backend allows empty ingredients).
            We can add ingredient search + unit inputs next using `/api/recipes/ingredients/search`.
          </Text>
        </Stack>
      </Modal>
    </Stack>
  );
}
