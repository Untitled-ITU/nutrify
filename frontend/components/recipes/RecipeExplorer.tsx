"use client";

import { useMemo, useState } from "react";
import { Select, TextInput } from "@mantine/core";
import { IconArrowsSort, IconFilter, IconSearch } from "@tabler/icons-react";

import { Recipe, FiltersState } from "./types";
import { RecipeTable } from "./RecipeTable";
import { FilterChip } from "./FilterChip";

const ALL_INGREDIENTS = [
    "Eggs",
    "Cheese",
    "Spinach",
    "Tomato",
    "Onion",
    "Mushroom",
    "Garlic",
    "Zucchini",
];

type Props = {
    recipes: Recipe[];
};

export function RecipeExplorer({ recipes }: Props) {
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("recent");
    const [includeValue, setIncludeValue] = useState<string | null>(null);
    const [excludeValue, setExcludeValue] = useState<string | null>(null);

    const [filters, setFilters] = useState<FiltersState>({
        vegetarian: false,
        ingredients: [],
    });

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

    const visibleRecipes = useMemo(() => {
        let data = [...recipes];

        if (search.trim()) {
            data = data.filter((r) =>
                r.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        filters.ingredients.forEach((f) => {
            data =
                f.type === "include"
                    ? data.filter((r) => r.ingredients.includes(f.value))
                    : data.filter((r) => !r.ingredients.includes(f.value));
        });

        if (sort === "name") data.sort((a, b) => a.name.localeCompare(b.name));
        if (sort === "creator")
            data.sort((a, b) => a.creator.localeCompare(b.creator));
        if (sort === "cuisine")
            data.sort((a, b) => a.cuisine.localeCompare(b.cuisine));

        return data;
    }, [recipes, search, sort, filters]);

    const usedIngredients = filters.ingredients
        .filter((f) => f.type === "include")
        .map((f) => f.value);

    const excludedIngredients = filters.ingredients
        .filter((f) => f.type === "exclude")
        .map((f) => f.value);

    return (
        <>
            {/* Controls */}
            <div className="mb-8 space-y-6">
                <div className="flex justify-between">
                    <TextInput
                        placeholder="Search recipes..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) =>
                            setSearch(e.currentTarget.value)
                        }
                    />

                    <div className="flex gap-3 items-center">
                        <IconArrowsSort />
                        <Select
                            value={sort}
                            onChange={(v) => setSort(v ?? "recent")}
                            data={[
                                { value: "recent", label: "Recent" },
                                { value: "name", label: "Name" },
                                { value: "creator", label: "Creator" },
                                { value: "cuisine", label: "Cuisine" },
                            ]}
                        />
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <Select
                        placeholder="Include ingredient"
                        value={includeValue}
                        data={ALL_INGREDIENTS.filter(
                            (i) => !usedIngredients.includes(i)
                        )}
                        onChange={(v) => v && addIngredientFilter("include", v)}
                    />

                    <Select
                        placeholder="Exclude ingredient"
                        value={excludeValue}
                        data={ALL_INGREDIENTS.filter(
                            (i) => !excludedIngredients.includes(i)
                        )}
                        onChange={(v) => v && addIngredientFilter("exclude", v)}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {filters.ingredients.map((f, i) => (
                        <FilterChip
                            key={i}
                            label={`${f.type.charAt(0).toUpperCase()}${f.type.slice(1)} "${f.value}"`}
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

            <RecipeTable recipes={visibleRecipes} />
        </>
    );
}
