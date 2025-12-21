import { authFetch } from "@/app/providers/AuthProvider";
import { API_BASE_URL } from "./config";
import { Recipe } from "@/components/recipes/types";
import { notifications } from "@mantine/notifications";
import { IconHeart, IconX } from "@tabler/icons-react";

export async function addFavorite(recipeId: number) {
    const res = await authFetch(
        `${API_BASE_URL}/api/recipes/favorites`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ recipe_id: recipeId }),
        }
    );

    if (!res.ok) {
        throw new Error("Failed to add favorite");
    }

    return res.json();
};

export async function handleAddFavorite(r: Recipe) {
    try {
        await addFavorite(r.id);

        notifications.show({
            title: "Added to favorites",
            message: `"${r.title}" was added to your favorites.`,
            color: "red",
            icon: <IconHeart size={18} />,
        });
    } catch {
        notifications.show({
            title: "Failed to add favorite",
            message: "Something went wrong. Please try again.",
            color: "red",
            icon: <IconX size={18} />,
        });
    }
};

export async function removeFavorite(recipeId: number) {
    const res = await authFetch(
        `${API_BASE_URL}/api/recipes/favorites/${recipeId}`,
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ recipe_id: recipeId }),
        }
    );

    if (!res.ok) {
        throw new Error("Failed to remove favorite");
    }

    return res.json();
};

export async function handleRemoveFavorite(r: Recipe) {
    try {
        await removeFavorite(r.id);

        notifications.show({
            title: "Removed from favorites",
            message: `"${r.title}" was removed from your favorites.`,
            color: "red",
            icon: <IconHeart size={18} />,
        });
    } catch {
        notifications.show({
            title: "Failed to remove favorite",
            message: "Something went wrong. Please try again.",
            color: "red",
            icon: <IconX size={18} />,
        });
    }
    return r.id;
};

export async function fetchCollections() {
    const res = await authFetch(`${API_BASE_URL}/api/recipes/collections`);

    if (!res.ok) {
        throw new Error("Failed to fetch collections");
    }

    return res.json(); // { collections: [...] }
}

export async function addRecipeToCollection(
    collectionId: number,
    recipeId: number
) {
    const res = await authFetch(
        `${API_BASE_URL}/api/recipes/collections/${collectionId}/recipes`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipe_id: recipeId }),
        }
    );

    if (!res.ok) {
        throw new Error("Failed to add recipe to collection");
    }

    return res.json();
}
