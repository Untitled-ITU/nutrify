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
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconChefHat, IconCheck, IconX } from "@tabler/icons-react";

import {
  ChefRecipeSummary,
  ChefStats,
  fetchChefRecipes,
  fetchChefStats,
  fetchProfile,
  updateUsername,
  deleteChefRecipe,
  fetchChefOwnProfile,
  updateChefOwnProfile,
  forgotPassword,
  resetPassword, 
} from "@/lib/chef";

/** ---- Website normalization helper (Option B) ---- */
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

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Paper radius="md" p="md" withBorder>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text fw={700} size="xl">
        {value}
      </Text>
    </Paper>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] =
    useState<Awaited<ReturnType<typeof fetchProfile>> | null>(null);

  const [stats, setStats] = useState<ChefStats | null>(null);
  const [recipes, setRecipes] = useState<ChefRecipeSummary[]>([]);

  const [busy, setBusy] = useState(false);
  const [chefProfileBusy, setChefProfileBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [sendCodeBusy, setSendCodeBusy] = useState(false);


  const isChef = useMemo(
    () => profile?.role === "chef" || profile?.role === "admin",
    [profile]
  );

  // Username form (for BOTH consumer + chef)
  const usernameForm = useForm({
    initialValues: { username: "" },
    validate: {
      username: (v) =>
        v.trim().length < 2 ? "Username must be at least 2 characters" : null,
    },
  });

  // Consumer reset-password form (email is taken from profile)
    const resetForm = useForm({
    initialValues: {
      code: "",
      new_password: "",
      confirm_password: "",
    },
    validate: {
      code: (v) => (v.trim().length !== 6 ? "Code must be exactly 6 characters" : null),
      new_password: (v) => (v.trim().length < 6 ? "Password must be at least 6 characters" : null),
      confirm_password: (v, values) => (v !== values.new_password ? "Passwords do not match" : null),
    },
  });


  // Chef public profile form (only for chefs)
  const chefProfileForm = useForm({
    initialValues: {
      bio: "",
      website: "",
      location: "",
    },
  });

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

          const cp = await fetchChefOwnProfile();
          chefProfileForm.setValues({
            bio: cp.bio ?? "",
            website: cp.website ?? "",
            location: cp.location ?? "",
          });
        }
      } catch {
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

 async function onSendResetCode() {
  if (!profile?.email) return;
  try {
    setSendCodeBusy(true);
    const res = await forgotPassword({ email: profile.email });
    notifications.show({
      title: "Reset code sent",
      message: res.msg ?? "Check your email for the 6-digit code.",
      color: "green",
      icon: <IconCheck size={18} />,
    });
  } catch {
    notifications.show({
      title: "Failed to send code",
      message: "Could not send reset code. Please try again.",
      color: "red",
      icon: <IconX size={18} />,
    });
  } finally {
    setSendCodeBusy(false);
  }
}

async function onResetPassword() {
  if (!profile) return;
  const valid = resetForm.validate();
  if (valid.hasErrors) return;

  try {
    setResetBusy(true);
    const res = await resetPassword({
      email: profile.email,
      code: resetForm.values.code.trim(),
      new_password: resetForm.values.new_password,
    });

    notifications.show({
      title: "Password updated",
      message: res.msg ?? "Your password was updated successfully.",
      color: "green",
      icon: <IconCheck size={18} />,
    });

    resetForm.reset();
  } catch {
    notifications.show({
      title: "Reset failed",
      message: "Could not reset password. Check your code and try again.",
      color: "red",
      icon: <IconX size={18} />,
    });
  } finally {
    setResetBusy(false);
  }
}

  async function onSaveChefPublicProfile() {
    try {
      setChefProfileBusy(true);

      const normalizedWebsite = toExternalUrl(chefProfileForm.values.website);

      if (chefProfileForm.values.website?.trim() && !normalizedWebsite) {
        notifications.show({
          title: "Invalid website",
          message:
            "Please enter a valid website (example.com or https://example.com).",
          color: "red",
          icon: <IconX size={18} />,
        });
        return;
      }

      const payload = {
        bio: chefProfileForm.values.bio?.trim() || null,
        website: normalizedWebsite,
        location: chefProfileForm.values.location?.trim() || null,
      };

      const res = await updateChefOwnProfile(payload);

      chefProfileForm.setFieldValue("website", normalizedWebsite ?? "");

      notifications.show({
        title: "Profile updated",
        message: res.msg,
        color: "green",
        icon: <IconCheck size={18} />,
      });
    } catch {
      notifications.show({
        title: "Update failed",
        message: "Could not update chef profile.",
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setChefProfileBusy(false);
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
              <Badge
                leftSection={<IconChefHat size={14} />}
                color={isChef ? "grape" : "gray"}
              >
                {isChef ? "Chef" : "User"}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed">
              {profile.email}
            </Text>
          </div>
        </Group>
      </Group>

      <Divider />

      {/* CONSUMER */}
        {!isChef ? (
          <>
            <Card withBorder radius="md" p="lg">
              <Title order={4}>Account Settings</Title>
              <Text c="dimmed" size="sm" mt={4}>
                Update your username.
              </Text>

              <Group mt="md" align="end">
                <TextInput
                  label="Username"
                  placeholder="Your username"
                  w={320}
                  {...usernameForm.getInputProps("username")}
                />
                <Button loading={busy} onClick={onSaveUsername} color="green">
                  Save
                </Button>
              </Group>
            </Card>

            <Card withBorder radius="md" p="lg">
              <Group justify="space-between" align="center" wrap="wrap">
                <div>
                  <Title order={4}>Reset Password</Title>
                  <Text c="dimmed" size="sm" mt={4}>
                    Send a reset code to your email, then enter it below.
                  </Text>
                </div>

                <Button loading={sendCodeBusy} onClick={onSendResetCode} variant="outline" color="green">
                  Send Reset Code
                </Button>
              </Group>

              <TextInput mt="md" label="Email" value={profile.email} disabled />

              <TextInput
                mt="md"
                label="6-digit code"
                placeholder="123456"
                maxLength={6}
                {...resetForm.getInputProps("code")}
              />

              <SimpleGrid cols={{ base: 1, sm: 2 }} mt="md">
                <PasswordInput
                  label="New password"
                  placeholder="New password"
                  {...resetForm.getInputProps("new_password")}
                />
                <PasswordInput
                  label="Confirm password"
                  placeholder="Confirm password"
                  {...resetForm.getInputProps("confirm_password")}
                />
              </SimpleGrid>

              <Group justify="flex-end" mt="md">
                <Button loading={resetBusy} onClick={onResetPassword} color="green">
                  Reset Password
                </Button>
              </Group>
            </Card>
          </>
        ) : (

        /* CHEF (same as before) */
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
              <Button loading={busy} onClick={onSaveUsername} color="green">
                Save
              </Button>
            </Group>
          </Card>
          {/* Reset Password (Chef also) */}
          <Card withBorder radius="md" p="lg">
            <Group justify="space-between" align="center" wrap="wrap">
              <div>
                <Title order={4}>Reset Password</Title>
                <Text c="dimmed" size="sm" mt={4}>
                  Send a reset code to your email, then enter it below.
                </Text>
              </div>

              <Button
                loading={sendCodeBusy}
                onClick={onSendResetCode}
                variant="outline"
                color="green"
              >
                Send Reset Code
              </Button>
            </Group>

            <TextInput mt="md" label="Email" value={profile.email} disabled />

            <TextInput
              mt="md"
              label="6-digit code"
              placeholder="123456"
              maxLength={6}
              {...resetForm.getInputProps("code")}
            />

            <SimpleGrid cols={{ base: 1, sm: 2 }} mt="md">
              <PasswordInput
                label="New password"
                placeholder="New password"
                {...resetForm.getInputProps("new_password")}
              />
              <PasswordInput
                label="Confirm password"
                placeholder="Confirm password"
                {...resetForm.getInputProps("confirm_password")}
              />
            </SimpleGrid>

            <Group justify="flex-end" mt="md">
              <Button loading={resetBusy} onClick={onResetPassword} color="green">
                Reset Password
              </Button>
            </Group>
          </Card>

          {/* Chef Public Profile */}
          <Card withBorder radius="md" p="lg">
            <Title order={4}>Chef Public Profile</Title>
            <Text c="dimmed" size="sm" mt={4}>
              This is what people see on your public chef profile.
            </Text>

            <Textarea
              mt="md"
              label="Bio"
              placeholder="Tell people about your cooking style, specialties..."
              minRows={4}
              autosize
              {...chefProfileForm.getInputProps("bio")}
            />

            <SimpleGrid cols={{ base: 1, sm: 2 }} mt="md">
              <TextInput
                label="Website"
                placeholder="example.com or https://example.com"
                {...chefProfileForm.getInputProps("website")}
              />
              <TextInput
                label="Location"
                placeholder="Istanbul, TR"
                {...chefProfileForm.getInputProps("location")}
              />
            </SimpleGrid>

            <Group justify="flex-end" mt="md">
              <Button
                loading={chefProfileBusy}
                onClick={onSaveChefPublicProfile}
                color="green"
              >
                Save Public Profile
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
                          {r.category ? <Badge variant="light">{r.category}</Badge> : null}
                          {r.cuisine ? <Badge variant="light">{r.cuisine}</Badge> : null}
                        </Group>
                      </div>

                      <Group>
                        <Button
                          variant="outline"
                          color="red"
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
        </>
      )}
    </Stack>
  );
}
