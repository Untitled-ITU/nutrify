import { useState, useMemo } from "react";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { ActionIcon, Pagination, useMantineTheme } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { Recipe } from "./types";
import { authFetch } from "@/app/providers/AuthProvider";
import { API_BASE_URL } from "@/lib/config";

type Props = {
    recipes: Recipe[];
    onOpen?: (r: Recipe) => void;
    pageSize?: number;
    renderActions?: (recipe: Recipe) => React.ReactNode;
};

export function RecipeTable({
    recipes,
    onOpen,
    pageSize = 10,
    renderActions,
}: Props) {
    const theme = useMantineTheme();
    const [page, setPage] = useState(1);

    const totalPages = Math.ceil(recipes.length / pageSize);

    const paginatedRecipes = useMemo(() => {
        const start = (page - 1) * pageSize;
        return recipes.slice(start, start + pageSize);
    }, [recipes, page, pageSize]);

    return (
        <div
            className="w-full p-4 rounded-xl min-h-96 flex flex-col"
            style={{ backgroundColor: theme.other.contentBackground }}
        >
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-end mb-6">
                    <Pagination
                        value={page}
                        onChange={setPage}
                        total={totalPages}
                    />
                </div>
            )}

            {/* Header */}
            <div className="bg-[#F6EDEA] rounded-xl px-6 py-4 text-xl font-bold mb-3">
                <div className="grid grid-cols-[4fr_2fr_2fr_1fr_1fr]">
                    <span>Recipe Name</span>
                    <span>Category</span>
                    <span>Cuisine</span>
                    <span>Rating</span>
                    <span className="text-right">Actions</span>
                </div>
            </div>

            {/* Rows */}
            <div className="space-y-3 flex-1">
                {paginatedRecipes.map((r) => (
                    <div
                        key={r.id}
                        className="bg-[#E7C6BC] rounded-xl px-6 py-4"
                    >
                        <div className="grid grid-cols-[4fr_2fr_2fr_1fr_1fr] items-center">
                            <span className="font-medium">{r.title}</span>
                            <span>{r.category}</span>
                            <span>{r.cuisine}</span>
                            <span className="font-bold">
                                {r.average_rating || "-"}
                            </span>

                            <div className="flex justify-end gap-3">
                                <ActionIcon
                                    style={{ backgroundColor: theme.other.primaryDark }}
                                    onClick={() => onOpen?.(r)}
                                >
                                    <IconExternalLink size={28} />
                                </ActionIcon>

                                {renderActions?.(r)}
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
