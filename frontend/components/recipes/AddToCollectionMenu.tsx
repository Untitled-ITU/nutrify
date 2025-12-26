"use client";

import { useEffect, useState } from "react";
import { Menu, Loader, Button, useMantineTheme } from "@mantine/core";
import { IconBookmark, IconCheck, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { fetchCollections, addRecipeToCollection } from "@/lib/tableActions";
import { Recipe } from "@/components/recipes/types";

type Props = {
    recipe: Recipe;
    variant?: "menu-item" | "button" | "dropdown";
};

export function AddToCollectionMenu({
    recipe,
    variant = "menu-item",
}: Props) {
    const [collections, setCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const theme = useMantineTheme();

    useEffect(() => {
        fetchCollections()
            .then((data) => setCollections(data.collections ?? []))
            .catch(() => setCollections([]));
    }, []);

    const handleAdd = async (collectionId: number) => {
        setLoading(true);
        try {
            await addRecipeToCollection(collectionId, recipe.id);

            notifications.show({
                title: "Added to collection",
                message: `"${recipe.title}" was added.`,
                color: "green",
                icon: <IconCheck size={18} />,
            });
        } catch {
            notifications.show({
                title: "Failed to add",
                message: "Please try again.",
                color: "red",
                icon: <IconX size={18} />,
            });
        } finally {
            setLoading(false);
        }
    };

    const dropdown = (
        <Menu.Dropdown>
            {loading && (
                <Menu.Item>
                    <Loader size="xs" />
                </Menu.Item>
            )}

            {!loading && collections.length === 0 && (
                <Menu.Item disabled>No collections</Menu.Item>
            )}

            {!loading &&
                collections.map((c) => (
                    <Menu.Item
                        key={c.id}
                        onClick={() => handleAdd(c.id)}
                    >
                        {c.name}
                    </Menu.Item>
                ))}
        </Menu.Dropdown>
    );

    if (variant === "dropdown") {
        return (
            <>
                {dropdown}
            </>
        );
    }

    else if (variant === "button") {
        return (
            <Menu shadow="md" width={220}>
                <Menu.Target>
                    <Button
                        leftSection={<IconBookmark size={18} />}
                        style={{ backgroundColor: theme.other.primaryDark }}
                    >
                        Add to collection
                    </Button>
                </Menu.Target>
                {dropdown}
            </Menu>
        );
    }

    return (
        <Menu.Item
            leftSection={<IconBookmark size={16} />}
            closeMenuOnClick={false}
        >
            <Menu trigger="click" position="left" shadow="md">
                <Menu.Target>
                    <span>Add to collection</span>
                </Menu.Target>
                {dropdown}
            </Menu>
        </Menu.Item>
    );
}
