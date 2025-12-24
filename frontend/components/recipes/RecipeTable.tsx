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
                <div className="gap-4 grid grid-cols-[2.5fr_2.5fr_1fr_1fr_1fr_1fr] divide-x divide-black/10">
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
                        className="min-h-32 shadow-md bg-[#E7C6BC] rounded-xl px-6 py-4
                    bg-no-repeat
                    bg-left
                    bg-contain
                        "
                        style={{
                            backgroundImage: `
                                      linear-gradient(
                                        to left,
                                        rgba(231,198,188,1) 0%,
                                        rgba(231,198,188,0.65) 20%,
                                        rgba(231,198,188,0.55) 50%,
                                        rgba(231,198,188,0.45) 60%,
                                        rgba(231,198,188,0.25) 70%,
                                        rgba(231,198,188,0) 100%
                                      ),
                                      url(${r.image_url})
                                    `,
                            backgroundSize: "30% auto",
                        }}
                    >
                        <div
                            className="
                          pointer-events-none
                          absolute inset-0
                          bg-cover
                          bg-right
                          opacity-40
                          mask-image-[linear-gradient(to_right,black_0%,black_50%,transparent_100%)]
                          [-webkit-mask-image:linear-gradient(to_right,black_0%,black_50%,transparent_100%)]
                        "
                        />
                        <div className="gap-4 grid grid-cols-[2.5fr_2.5fr_1fr_1fr_1fr_1fr] items-start">
                            <span className="text-left text-3xl text-white font-bold drop-shadow-[0_4px_4px_rgba(0,0,0,1)]">{r.title}</span>
                            <TruncatedText text={r.description} maxChars={120} />
                            <span className="capitalize">{r.category}</span>
                            <span className="capitalize">{r.cuisine}</span>
                            <span
                                className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-[#F6EDEA] text-[#6A3E37] "
                            >
                                <StarRating rating={r.average_rating} />
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


const StarRating = ({ rating = 0 }: { rating?: number }) => {
    return (
        <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1;
                const filled = rating >= value;
                const half = rating >= value - 0.5 && rating < value;

                return (
                    <svg
                        key={i}
                        viewBox="0 0 24 24"
                        className="w-4 h-4"
                    >
                        <defs>
                            <linearGradient id={`half-${i}`}>
                                <stop offset="50%" stopColor="#E3A008" />
                                <stop offset="50%" stopColor="#E5E7EB" />
                            </linearGradient>
                        </defs>

                        <path
                            fill={half ? `url(#half-${i})` : filled ? "#E3A008" : "#E5E7EB"}
                            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                        />
                    </svg>
                );
            })}
        </div>
    );
};
