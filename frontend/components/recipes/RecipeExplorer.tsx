"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, TextInput } from "@mantine/core";
import { IconArrowsSort, IconSearch } from "@tabler/icons-react";

import ingredientsJson from "@/ingredients.json";
import { Recipe, FiltersState } from "./types";
import { RecipeTable } from "./RecipeTable";
import { FilterChip } from "./FilterChip";

type Props = {
    recipes: Recipe[];
    onFiltersChangeAction: (filters: {
        q?: string;
        ingredients?: string[];
        sort_by?: string;
    }) => void;
};

const INGREDIENT_UNITS = ingredientsJson as Record<string, string[]>;

const formatIngredientLabel = (value: string) =>
    value
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

export function RecipeExplorer({ recipes, onFiltersChangeAction: onFiltersChange }: Props) {
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("created_at");
    const [includeValue, setIncludeValue] = useState<string | null>(null);
    const [excludeValue, setExcludeValue] = useState<string | null>(null);

    const [filters, setFilters] = useState<FiltersState>({
        vegetarian: false,
        ingredients: [],
    });

    const ALL_INGREDIENTS = useMemo(
        () => Object.keys(INGREDIENT_UNITS).sort(),
        []
    );

    const addIngredientFilter = (
        type: "include" | "exclude",
        value: string
    ) => {
        setFilters((prev) => ({
            ...prev,
            ingredients: [...prev.ingredients, { type, value }],
        }));

        type === "include"
            ? setIncludeValue(null)
            : setExcludeValue(null);
    };

    const usedIngredients = filters.ingredients
        .filter((f) => f.type === "include")
        .map((f) => f.value);

    const excludedIngredients = filters.ingredients
        .filter((f) => f.type === "exclude")
        .map((f) => f.value);

    /**
     * 🔥 Emit filters to parent (DiscoverPage)
     */
    useEffect(() => {
        onFiltersChange({
            q: search || undefined,
            ingredients: filters.ingredients
                .filter((f) => f.type === "include")
                .map((f) => f.value),
            sort_by: sort,
        });
    }, [search, filters, sort, onFiltersChange]);

    return (
        <>
            {/* Search + Sort */}
            <div className="mb-8 space-y-6">
                <div className="flex justify-between gap-4">
                    <TextInput
                        placeholder="Search recipes..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) =>
                            setSearch(e.currentTarget.value)
                        }
                        className="flex-1 max-w-lg"
                    />

                    <div className="flex items-center gap-2">
                        <IconArrowsSort />
                        <Select
                            value={sort}
                            onChange={(v) => setSort(v ?? "created_at")}
                            data={[
                                { value: "created_at", label: "Newest" },
                                { value: "rating", label: "Rating" },
                                { value: "title", label: "Title" },
                                { value: "category", label: "Category" },
                                { value: "cuisine", label: "Cuisine" },
                            ]}
                        />
                    </div>
                </div>

                {/* Ingredient filters */}
                <div className="flex gap-3 justify-end">
                    <Select
                        placeholder="Include ingredient"
                        searchable
                        value={includeValue}
                        data={ALL_INGREDIENTS
                            .filter((i) => !usedIngredients.includes(i))
                            .map((i) => ({
                                value: i,
                                label: formatIngredientLabel(i),
                            }))}
                        onChange={(v) =>
                            v && addIngredientFilter("include", v)
                        }
                    />
                    {
                        /*
                           <Select
                           placeholder="Exclude ingredient"
                           searchable
                           value={excludeValue}
                           data={ALL_INGREDIENTS
                           .filter((i) => !excludedIngredients.includes(i))
                           .map((i) => ({
value: i,
label: formatIngredientLabel(i),
}))}
onChange={(v) =>
v && addIngredientFilter("exclude", v)
}
/>
                         */
                    }
                </div>

                {/* Active filters */}
                <div className="flex flex-wrap gap-2">
                    {filters.ingredients.map((f, i) => (
                        <FilterChip
                            key={`${f.type}-${f.value}-${i}`}
                            label={`${f.type === "include" ? "Include" : "Exclude"} "${formatIngredientLabel(
                                f.value
                            )}"`}
                            onRemove={() =>
                                setFilters((prev) => ({
                                    ...prev,
                                    ingredients: prev.ingredients.filter(
                                        (_, idx) => idx !== i
                                    ),
                                }))
                            }
                        />
                    ))}
                </div>
            </div>

            {/* Results */}
            <RecipeTable recipes={recipes} />
        </>
    );
}
