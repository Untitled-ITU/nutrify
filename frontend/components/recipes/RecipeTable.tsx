import { useState, useMemo } from "react";
import { ActionIcon, Pagination, useMantineTheme } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { Recipe } from "./types";

export type SortKey = "title" | "category" | "cuisine" | "rating";
export type SortDir = "asc" | "desc";

type Props = {
    recipes: Recipe[];
    onOpen?: (r: Recipe) => void;
    pageSize?: number;
    renderActions?: (recipe: Recipe) => React.ReactNode;

    sortBy?: SortKey;
    sortDir?: SortDir;
    onSortChange?: (key: SortKey) => void;
};

export function RecipeTable({
    recipes,
    onOpen,
    pageSize = 10,
    renderActions,
    sortBy,
    sortDir,
    onSortChange,
}: Props) {
    const router = useRouter();
    const theme = useMantineTheme();
    const [page, setPage] = useState(1);

    const totalPages = Math.ceil(recipes.length / pageSize);

    const paginatedRecipes = useMemo(() => {
        const start = (page - 1) * pageSize;
        return recipes.slice(start, start + pageSize);
    }, [recipes, page, pageSize]);

    return (
        <div
            className="shadow-xl w-full p-4 rounded-xl min-h-96 flex flex-col"
            style={{ backgroundColor: theme.other.contentBackground }}
        >
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-end mb-6">
                    <Pagination
                        color={theme.other.primaryDark}
                        value={page}
                        onChange={setPage}
                        total={totalPages}
                    />
                </div>
            )}

            {/* Header */}
            <div className="shadow-md bg-[#F6EDEA] rounded-xl px-6 py-4 text-lg font-bold mb-3">
                <div className="gap-4 grid grid-cols-[2fr_3fr_1fr_1fr_1fr_1fr] divide-x divide-black/10">
                    <SortableHeader
                        label="Recipe Name"
                        column="title"
                        active={sortBy === "title"}
                        direction={sortDir}
                        onSort={onSortChange}
                    />

                    <span>Description</span>

                    <SortableHeader
                        label="Category"
                        column="category"
                        active={sortBy === "category"}
                        direction={sortDir}
                        onSort={onSortChange}
                    />

                    <SortableHeader
                        label="Cuisine"
                        column="cuisine"
                        active={sortBy === "cuisine"}
                        direction={sortDir}
                        onSort={onSortChange}
                    />

                    <SortableHeader
                        label="Rating"
                        column="rating"
                        active={sortBy === "rating"}
                        direction={sortDir}
                        onSort={onSortChange}
                    />

                    <span className="text-right">Actions</span>
                </div>
            </div>

            {/* Rows */}
            <div className="space-y-3 flex-1">
                {paginatedRecipes.map((r) => (
                    <div
                        key={r.id}
                        className="shadow-md bg-[#E7C6BC] rounded-xl px-6 py-4 transition hover:shadow-md hover:-translate-y-1px hover:bg-[#EFD2C9] "
                    >
                        <div className="gap-4 grid grid-cols-[2fr_3fr_1fr_1fr_1fr_1fr] items-start">
                            <span className="font-bold">{r.title}</span>
                            <TruncatedText text={r.description} maxChars={120} />
                            <span className="capitalize">{r.category}</span>
                            <span className="capitalize">{r.cuisine}</span>
                            <span
                                className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-[#F6EDEA] text-[#6A3E37] "
                            >
                                {r.average_rating || "—"}
                            </span>

                            <div className="flex justify-end gap-3">
                                <ActionIcon
                                    style={{ backgroundColor: theme.other.accentColor }}
                                    onClick={() => router.push(`/recipes/details/${r.id}`)}
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

import {
    IconChevronUp,
    IconChevronDown,
    IconSelector,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { TruncatedText } from "../TruncatedText";

function SortableHeader({
    label,
    column,
    active,
    direction,
    onSort,
}: {
    label: string;
    column: SortKey;
    active?: boolean;
    direction?: SortDir;
    onSort?: (key: SortKey) => void;
}) {
    return (
        <button
            onClick={() => onSort?.(column)}
            className="flex items-center gap-1 font-bold hover:opacity-80"
        >
            <span>{label}</span>

            <span className="ms-1 flex flex-col leading-none">
                {!active && (
                    <IconSelector size={24} className="opacity-40" />
                )}

                {active && direction === "asc" && (
                    <IconChevronUp size={24} />
                )}

                {active && direction === "desc" && (
                    <IconChevronDown size={24} />
                )}
            </span>
        </button>
    );
}
