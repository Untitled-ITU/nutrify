"use client"
import { useAuth } from "@/app/providers/AuthProvider";
import { AppShell, Burger, Button, Center, Group, useMantineTheme } from "@mantine/core";
import { Menu } from "@mantine/core";
import { IconHeart, IconBook, IconArrowDown, IconChevronDown } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";

export default function Navbar() {
    const [opened, { toggle }] = useDisclosure();
    const theme = useMantineTheme();
    const { user, logout } = useAuth();  // 👈 AUTH HERE

    console.log(user);

    return (
        <AppShell
            padding="md"
            header={{ height: 60 }}
        >
            <AppShell.Header className="shadow-xl" style={{ backgroundColor: theme.other.primaryDark }}>
                <Center h="100%" >
                    <Group className="max-w-7xl" w="100%">
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <Group justify="space-between" style={{ flex: 1 }}>
                            <Button
                                variant="unstyled"
                                component={Link}
                                href="/"
                                className="text-white font-bold p-0 hover:bg-transparent"
                                styles={{
                                    root: {
                                        backgroundColor: "transparent",
                                    },
                                }}
                                fz="h2"
                            >
                                Nutrify
                            </Button>
                            <Group ml="xl" gap={0} visibleFrom="sm">
                                {
                                    user ? (
                                        <>
                                            <Button variant="subtle" size="xl" fz="h3" color={theme.white} radius={0} component={Link} href="/discover" >Discover</Button>

                                            <Menu
                                                trigger="click" openDelay={100} closeDelay={200} withinPortal
                                            >
                                                <Menu.Target>
                                                    <Button
                                                        variant="subtle" size="xl" fz="h3" color={theme.white} radius={0}
                                                    >
                                                        Recipes
                                                        <IconChevronDown />
                                                    </Button>
                                                </Menu.Target>

                                                <Menu.Dropdown>
                                                    <Menu.Item
                                                        leftSection={<IconHeart size={18} />} component={Link} href="/recipes/favorites"
                                                    >
                                                        Favorites
                                                    </Menu.Item>

                                                    <Menu.Item
                                                        leftSection={<IconBook size={18} />} component={Link} href="/recipes/collections"
                                                    >
                                                        Collections
                                                    </Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                            <Button variant="subtle" size="xl" fz="h3" color={theme.white} radius={0} component={Link} href="/meal-plan" >Meal Plan</Button>
                                            <Button variant="subtle" size="xl" fz="h3" color={theme.white} radius={0} component={Link} href="/profile" >Profile</Button>
                                            <Button
                                                variant="subtle"
                                                size="xl"
                                                fz="h3"
                                                color={theme.white}
                                                radius={0}
                                                onClick={() => logout()}
                                            >
                                                Logout
                                            </Button>
                                        </>
                                    ) : (<>
                                        <Button variant="subtle" size="xl" fz="h3" color={theme.white} radius={0} component={Link} href="/auth/login" >Login</Button>
                                        <Button variant="subtle" size="xl" fz="h3" color={theme.white} radius={0} component={Link} href="/auth/signup" >Sign Up</Button>

                                    </>)
                                }
                            </Group>
                        </Group>
                    </Group>
                </Center>
            </AppShell.Header>
        </AppShell>
    );
}
