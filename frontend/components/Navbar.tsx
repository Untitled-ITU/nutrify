"use client"
import { AppShell, Burger, Button, Center, Group, useMantineTheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";

export default function Navbar() {
  const [opened, { toggle }] = useDisclosure();
  const theme = useMantineTheme();

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
                <Button variant="subtle" size="xl" fz="h3" color={theme.white} radius={0} component={Link} href="/auth/login" >Login</Button>
                <Button variant="subtle" size="xl" fz="h3" color={theme.white} radius={0} component={Link} href="/auth/signup" >Sign Up</Button>
              </Group>
            </Group>
          </Group>
        </Center>
      </AppShell.Header>
    </AppShell>
  );
}
