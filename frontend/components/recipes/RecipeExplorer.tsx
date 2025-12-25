"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionIcon, Menu, Select, TextInput, Tooltip, useMantineTheme } from "@mantine/core";
import { IconArrowsSort, IconBan, IconBookmark, IconCategory, IconCheck, IconHeart, IconLeaf, IconPlus, IconSearch, IconSeeding, IconWorld, IconX } from "@tabler/icons-react";

import ingredientsJson from "@/ingredients.json";
import { Recipe, FiltersState } from "./types";
import { RecipeTable, SortKey } from "./RecipeTable";
import { FilterChip } from "./FilterChip";

type Props = {
    recipes: Recipe[];
    onFiltersChangeAction: (filters: {
        q?: string;
        ingredients?: string[];
        excluded_ingredients?: string[];
        is_vegan?: boolean;
        is_vegetarian?: boolean;
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
    const [sortBy, setSortBy] = useState<SortKey>("rating");
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
        vegan: false,
        ingredients: [],
        excluded_ingredients: [],
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
            excluded_ingredients: filters.ingredients
                .filter((f) => f.type === "exclude")
                .map((f) => f.value),
            is_vegan: filters.vegan,
            is_vegetarian: filters.vegetarian,
        });
    }, [filters, onFiltersChange]);

    return (
        <>
            {/* Search + Filters Bar */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-end gap-3">
                    {/* Search - Fixed "Medium" width for professional dense feel */}
                    <TextInput
                        label="Search"
                        labelProps={{ style: { fontSize: 14, marginBottom: 4 } }}
                        placeholder="Recipe name..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        className="w-full sm:w-[240px] flex-shrink-0"
                        size="sm"
                    />

                    {/* Diet Toggles - Quick binary filters */}
                    <div className="flex gap-1 pb-[1px] flex-shrink-0">
                        <Tooltip label={filters.vegan ? "Vegetarian (Implied by Vegan)" : "Vegetarian"} withArrow>
                            <ActionIcon
                                variant={filters.vegetarian ? "filled" : "light"}
                                color="green"
                                size="lg"
                                radius="md"
                                disabled={filters.vegan}
                                onClick={() =>
                                    setFilters((prev) => ({ ...prev, vegetarian: !prev.vegetarian }))
                                }
                                aria-label="Vegetarian"
                            >
                                <IconLeaf size={20} />
                            </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Vegan" withArrow>
                            <ActionIcon
                                variant={filters.vegan ? "filled" : "light"}
                                color="green"
                                size="lg"
                                radius="md"
                                onClick={() =>
                                    setFilters((prev) => {
                                        const nextVegan = !prev.vegan;
                                        return {
                                            ...prev,
                                            vegan: nextVegan,
                                            vegetarian: nextVegan ? true : false
                                        };
                                    })
                                }
                                aria-label="Vegan"
                            >
                                <IconSeeding size={20} />
                            </ActionIcon>
                        </Tooltip>
                    </div>

                    {/* Dropdowns - Share remaining space equally */}
                    <Select
                        label="Cuisine"
                        labelProps={{ style: { fontSize: 14, marginBottom: 4 } }}
                        placeholder="Any"
                        searchable
                        leftSection={<IconWorld size={16} />}
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
                        size="sm"
                        className="flex-1 min-w-[140px]"
                    />

                    <Select
                        label="Category"
                        labelProps={{ style: { fontSize: 14, marginBottom: 4 } }}
                        placeholder="Any"
                        searchable
                        leftSection={<IconCategory size={16} />}
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
                        size="sm"
                        className="flex-1 min-w-[140px]"
                    />

                    {!disableIngredientFilter && (
                        <>
                            <Select
                                label="Include"
                                labelProps={{ style: { fontSize: 14, marginBottom: 4 } }}
                                placeholder="Ingredient"
                                searchable
                                leftSection={<IconPlus size={16} />}
                                value={includeValue}
                                data={ALL_INGREDIENTS
                                    .filter((i) => !usedIngredients.includes(i) && !excludedIngredients.includes(i))
                                    .map((i) => ({
                                        value: i,
                                        label: formatIngredientLabel(i),
                                    }))}
                                onChange={(v) => v && addIngredientFilter("include", v)}
                                size="sm"
                                className="flex-1 min-w-[140px]"
                            />
                            <Select
                                label="Exclude"
                                labelProps={{ style: { fontSize: 14, marginBottom: 4 } }}
                                placeholder="Ingredient"
                                searchable
                                leftSection={<IconBan size={16} style={{ color: theme.colors.red[6] }} />}
                                value={excludeValue}
                                data={ALL_INGREDIENTS
                                    .filter((i) => !usedIngredients.includes(i) && !excludedIngredients.includes(i))
                                    .map((i) => ({
                                        value: i,
                                        label: formatIngredientLabel(i),
                                    }))}
                                onChange={(v) => v && addIngredientFilter("exclude", v)}
                                size="sm"
                                className="flex-1 min-w-[140px]"
                            />
                        </>
                    )}
                </div>

                {/* Active filters chips (kept for functionality) */}
                <div className="flex flex-wrap gap-2 mt-4">
                    {filters.ingredients.map((f, i) => (
                        <FilterChip
                            key={`${f.type}-${f.value}-${i}`}
                            icon={f.type === "include" ? <IconPlus size={14} /> : <IconBan size={14} />}
                            color={f.type === "exclude" ? "red" : undefined}
                            label={`${f.type === "include" ? "Incl." : "Excl."} ${formatIngredientLabel(f.value)}`}
                            onRemove={() =>
                                setFilters((prev) => ({
                                    ...prev,
                                    ingredients: prev.ingredients.filter((_, idx) => idx !== i),
                                }))
                            }
                        />
                    ))}

                    {filters.cuisines.map((c, i) => (
                        <FilterChip
                            key={`cuisine-${c}-${i}`}
                            icon={<IconWorld size={14} />}
                            label={`${formatIngredientLabel(c)}`}
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
                            icon={<IconCategory size={14} />}
                            label={`${formatIngredientLabel(c)}`}
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
