"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionIcon, Menu, Select, TextInput, useMantineTheme } from "@mantine/core";
import { IconArrowsSort, IconBookmark, IconCheck, IconHeart, IconPlus, IconSearch, IconX } from "@tabler/icons-react";

import ingredientsJson from "@/ingredients.json";
import { Recipe, FiltersState } from "./types";
import { RecipeTable, SortKey } from "./RecipeTable";
import { FilterChip } from "./FilterChip";

type Props = {
    recipes: Recipe[];
    onFiltersChangeAction: (filters: {
        q?: string;
        ingredients?: string[];
        sort_by?: string;
    }) => void;

    renderActions?: (recipe: Recipe) => React.ReactNode;

    disableIngredientFilter?: boolean;
};

const INGREDIENT_UNITS = ingredientsJson as Record<string, string[]>;

const formatIngredientLabel = (value: string) =>
    value
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

export function RecipeExplorer({
    recipes,
    onFiltersChangeAction: onFiltersChange,
    renderActions,
    disableIngredientFilter,
}: Props) {
    const theme = useMantineTheme();
    const [search, setSearch] = useState("");
    const [includeValue, setIncludeValue] = useState<string | null>(null);
    const [excludeValue, setExcludeValue] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortKey>("title");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    const handleSortChange = (key: SortKey) => {
        if (sortBy === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(key);
            setSortDir("asc");
        }
        console.log(sortDir, sortBy);
    };

    const [filters, setFilters] = useState<FiltersState>({
        vegetarian: false,
        ingredients: [],
        cuisines: [],
        categories: [],
    });

    const ALL_INGREDIENTS = useMemo(
        () => Object.keys(INGREDIENT_UNITS).sort(),
        []
    );

    const ALL_CUISINES = useMemo(
        () => Array.from(new Set(recipes.map((r) => r.cuisine))).sort(),
        [recipes]
    );

    const ALL_CATEGORIES = useMemo(
        () => Array.from(new Set(recipes.map((r) => r.category))).sort(),
        [recipes]
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

    const visibleRecipes = useMemo(() => {
        let data = [...recipes];

        // 🔍 Local search
        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter((r) =>
                r.title.toLowerCase().includes(q)
            );
        }

        // 🍽 Cuisine filter
        if (filters.cuisines.length) {
            data = data.filter((r) =>
                filters.cuisines.includes(r.cuisine)
            );
        }

        // 🗂 Category filter
        if (filters.categories.length) {
            data = data.filter((r) =>
                filters.categories.includes(r.category)
            );
        }

        // 🔃 Local sort
        const dir = (sortDir === "asc" ? 1 : -1);

        switch (sortBy) {
            case "rating":
                data.sort(
                    (a, b) =>
                        ((a.average_rating ?? 0) - (b.average_rating ?? 0)) * dir
                );
                break;

            case "title":
                data.sort((a, b) => a.title.localeCompare(b.title) * dir);
                break;

            case "category":
                data.sort((a, b) => a.category.localeCompare(b.category) * dir);
                break;

            case "cuisine":
                data.sort((a, b) => a.cuisine.localeCompare(b.cuisine) * dir);
                break;

            // default:
            //     // Newest first by default
            //     if (sortDir === "asc") {
            //         data.reverse();
            //     }
            //     break;
        }

        return data;
    }, [
        recipes,
        search,
        sortBy,
        sortDir,
        filters.cuisines,
        filters.categories,
    ]);

    useEffect(() => {
        onFiltersChange({
            ingredients: filters.ingredients
                .filter((f) => f.type === "include")
                .map((f) => f.value),
        });
    }, [filters, onFiltersChange]);

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

                    <div className="flex gap-3 justify-end">
                        <Select
                            placeholder="Cuisine"
                            searchable
                            value={null}
                            data={ALL_CUISINES
                                .filter((c) => !filters.cuisines.includes(c))
                                .map((c) => ({
                                    value: c,
                                    label: formatIngredientLabel(c),
                                }))}
                            onChange={(v) =>
                                v &&
                                setFilters((prev) => ({
                                    ...prev,
                                    cuisines: [...prev.cuisines, v],
                                }))
                            }
                        />

                        <Select
                            placeholder="Category"
                            searchable
                            value={null}
                            data={ALL_CATEGORIES
                                .filter((c) => !filters.categories.includes(c))
                                .map((c) => ({
                                    value: c,
                                    label: formatIngredientLabel(c),
                                }))}
                            onChange={(v) =>
                                v &&
                                setFilters((prev) => ({
                                    ...prev,
                                    categories: [...prev.categories, v],
                                }))
                            }
                        />
                        {!disableIngredientFilter && (

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
                        )
                        }
                    </div>
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
                    {filters.cuisines.map((c, i) => (
                        <FilterChip
                            key={`cuisine-${c}-${i}`}
                            label={`Cuisine "${formatIngredientLabel(c)}"`}
                            onRemove={() =>
                                setFilters((prev) => ({
                                    ...prev,
                                    cuisines: prev.cuisines.filter((_, idx) => idx !== i),
                                }))
                            }
                        />
                    ))}

                    {filters.categories.map((c, i) => (
                        <FilterChip
                            key={`category-${c}-${i}`}
                            label={`Category "${formatIngredientLabel(c)}"`}
                            onRemove={() =>
                                setFilters((prev) => ({
                                    ...prev,
                                    categories: prev.categories.filter((_, idx) => idx !== i),
                                }))
                            }
                        />
                    ))}
                </div>
            </div>

            {/* Results */}

            <RecipeTable
                recipes={visibleRecipes}
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={handleSortChange}
                onOpen={(r) => console.log(r.id)}
                renderActions={renderActions}
            />
        </>
    );
}
