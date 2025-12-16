import { ActionIcon, useMantineTheme } from "@mantine/core";
import { IconExternalLink, IconHeart } from "@tabler/icons-react";
import { Recipe } from "./types";

type Props = {
    recipes: Recipe[];
    onOpen?: (r: Recipe) => void;
    onFavorite?: (r: Recipe) => void;
};

export function RecipeTable({ recipes, onOpen, onFavorite }: Props) {
    const theme = useMantineTheme();

    return (
        <div
            className="w-full p-4 rounded-xl min-h-96"
            style={{ backgroundColor: theme.other.contentBackground }}
        >
            <div className="bg-[#F6EDEA] rounded-xl px-6 py-4 text-xl font-bold mb-3">
                <div className="grid grid-cols-[2fr_3fr_2fr_2fr_1fr]">
                    <span>Recipe Name</span>
                    <span>Main Ingredients</span>
                    <span>Cuisine</span>
                    <span>Creator</span>
                    <span className="text-right">Actions</span>
                </div>
            </div>

            <div className="space-y-3">
                {recipes.map((r) => (
                    <div
                        key={r.id}
                        className="bg-[#E7C6BC] rounded-xl px-6 py-4"
                    >
                        <div className="grid grid-cols-[2fr_3fr_2fr_2fr_1fr] items-center">
                            <span className="font-medium">{r.name}</span>
                            <span>{r.ingredients.join(", ")}</span>
                            <span>{r.cuisine}</span>
                            <span>{r.creator}</span>

                            <div className="flex justify-end gap-3">
                                <ActionIcon onClick={() => onOpen?.(r)}>
                                    <IconExternalLink size={32} />
                                </ActionIcon>
                                <ActionIcon onClick={() => onFavorite?.(r)}>
                                    <IconHeart size={32} />
                                </ActionIcon>
                            </div>
                        </div>
                    </div>
                ))}

                {recipes.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No recipes found
                    </div>
                )}
            </div>
        </div>
    );
}
