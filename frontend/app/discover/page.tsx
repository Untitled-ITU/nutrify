"use client";

import { useEffect, useMemo, useState } from "react";
import { TextInput, Select, ActionIcon, useMantineTheme } from "@mantine/core";
import {
    IconX,
    IconHeart,
    IconExternalLink,
    IconSearch,
    IconFilter,
} from "@tabler/icons-react";

type Recipe = {
    id: string;
    name: string;
    ingredients: string[];
    cuisine: string;
    creator: string;
};

type IngredientFilter = {
    type: "include" | "exclude";
    value: string;
};

type FiltersState = {
    vegetarian: boolean;
    ingredients: IngredientFilter[];
};

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

export default function DiscoverPage() {
    const theme = useMantineTheme();
    const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("recent");

    const [includeValue, setIncludeValue] = useState<string | null>(null);
    const [excludeValue, setExcludeValue] = useState<string | null>(null);

    const [filters, setFilters] = useState<FiltersState>({
        vegetarian: false,
        ingredients: [],
    });

    useEffect(() => {
        setAllRecipes([
            {
                id: "1",
                name: "Veggie Omelette",
                ingredients: ["Eggs", "Spinach", "Cheese"],
                cuisine: "Mediterranean",
                creator: "Admin",
            },
            {
                id: "2",
                name: "Mushroom Scramble",
                ingredients: ["Eggs", "Mushroom", "Butter"],
                cuisine: "French",
                creator: "Chef Anna",
            },
            {
                id: "3",
                name: "Spinach & Feta Toast",
                ingredients: ["Bread", "Spinach", "Feta", "Eggs"],
                cuisine: "Greek",
                creator: "Nutrify",
            },
            {
                id: "4",
                name: "Avocado Egg Bowl",
                ingredients: ["Eggs", "Avocado", "Rice"],
                cuisine: "Californian",
                creator: "Healthy Eats",
            },
            {
                id: "5",
                name: "Shakshuka (No Onion)",
                ingredients: ["Eggs", "Tomato", "Bell Pepper"],
                cuisine: "Middle Eastern",
                creator: "Home Kitchen",
            },
            {
                id: "6",
                name: "Cheese & Herb Frittata",
                ingredients: ["Eggs", "Cheese", "Herbs"],
                cuisine: "Italian",
                creator: "Chef Marco",
            },
            {
                id: "7",
                name: "Egg Fried Rice (Veg)",
                ingredients: ["Eggs", "Rice", "Carrot", "Peas"],
                cuisine: "Asian",
                creator: "Daily Meals",
            },
            {
                id: "8",
                name: "Zucchini Egg Muffins",
                ingredients: ["Eggs", "Zucchini", "Cheese"],
                cuisine: "American",
                creator: "Nutrify",
            },
        ]);
    }, []);

    const addIngredientFilter = (
        type: "include" | "exclude",
        value: string
    ) => {
        setFilters((prev) => {
            const exists = prev.ingredients.some(
                (f) => f.type === type && f.value === value
            );

            if (exists) return prev;

            return {
                ...prev,
                ingredients: [...prev.ingredients, { type, value }],
            };
        });

        // clear select after adding
        if (type === "include") setIncludeValue(null);
        if (type === "exclude") setExcludeValue(null);
    };

    const visibleRecipes = useMemo(() => {
        let data = [...allRecipes];

        // 🔍 Search
        if (search.trim()) {
            data = data.filter((r) =>
                r.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (filters.vegetarian) {
            data = data.filter(
                (r) => !r.ingredients.includes("Meat")
            );
        }

        // Ingredient include/exclude
        filters.ingredients.forEach((f) => {
            if (f.type === "include") {
                data = data.filter((r) =>
                    r.ingredients.includes(f.value)
                );
            }
            if (f.type === "exclude") {
                data = data.filter(
                    (r) => !r.ingredients.includes(f.value)
                );
            }
        });

        if (sort === "name") {
            data.sort((a, b) => a.name.localeCompare(b.name));
        }
        if (sort === "creator") {
            data.sort((a, b) => a.creator.localeCompare(b.creator));
        }
        if (sort === "recent") {
            data.sort((a, b) => a.id.localeCompare(b.id));
        }
        if (sort === "cuisine") {
            data.sort((a, b) => a.cuisine.localeCompare(b.cuisine));
        }

        return data;
    }, [allRecipes, search, sort, filters]);

    const usedIngredients = filters.ingredients
        .filter((f) => f.type === "include")
        .map((f) => f.value);

    const excludedIngredients = filters.ingredients
        .filter((f) => f.type === "exclude")
        .map((f) => f.value);

    return (
        <div className="w-full">
            {/* Title */}
            <h1 className="text-4xl font-bold mb-8">
                Discover New Recipes
            </h1>

            {/* CONTROLS */}
            <div className="mb-8 space-y-6">
                <div className="flex justify-between items-start">
                    {/* Search */}
                    <div>
                        <label className="block font-medium mb-2">
                            Search by Name
                        </label>
                        <TextInput
                            placeholder="Search..."
                            leftSection={<IconSearch size={16} />}
                            value={search}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                            classNames={{
                                input:
                                    "bg-[#E7C6BC] border-none rounded-full w-72",
                            }}
                        />
                    </div>

                    {/* Sort + Filters */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <p className="font-medium mb-2">Sort By</p>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={sort}
                                    onChange={(v) => setSort(v ?? "recent")}
                                    data={[
                                        { value: "recent", label: "Most Recent" },
                                        { value: "name", label: "Name" },
                                        { value: "creator", label: "Creator" },
                                        { value: "cuisine", label: "Cuisine" },
                                    ]}
                                    classNames={{
                                        input:
                                            "bg-[#E7C6BC] border-none rounded-full w-48",
                                    }}
                                />
                                <IconFilter size={18} />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Select
                                placeholder="Include ingredient"
                                value={includeValue}
                                data={ALL_INGREDIENTS.filter(
                                    (ingredient) => !usedIngredients.includes(ingredient)
                                )}
                                onChange={(value) => {
                                    setIncludeValue(value);
                                    if (value) addIngredientFilter("include", value);
                                }}
                                classNames={{
                                    input: "bg-[#E7C6BC] border-none rounded-full w-48",
                                }}
                            />

                            <Select
                                placeholder="Exclude ingredient"
                                value={excludeValue}
                                data={ALL_INGREDIENTS.filter(
                                    (ingredient) => !excludedIngredients.includes(ingredient)
                                )}
                                onChange={(value) => {
                                    setExcludeValue(value);
                                    if (value) addIngredientFilter("exclude", value);
                                }}
                                classNames={{
                                    input: "bg-[#E7C6BC] border-none rounded-full w-48",
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* FILTER CHIPS */}
                <div className="flex flex-wrap gap-3 max-w-full">
                    {filters.ingredients.map((f, idx) => (
                        <FilterChip
                            key={idx}
                            label={
                                f.type === "include"
                                    ? `Include "${f.value}"`
                                    : `Exclude "${f.value}"`
                            }
                            onRemove={() =>
                                setFilters((prev) => ({
                                    ...prev,
                                    ingredients: prev.ingredients.filter(
                                        (_, i) => i !== idx
                                    ),
                                }))
                            }
                        />
                    ))}
                </div>
            </div>

            <div className="w-full p-4 rounded-xl min-h-96" style={{ backgroundColor: theme.other.contentBackground }}>
                {/* Table Header */}
                <div className="bg-[#F6EDEA] rounded-xl px-6 py-4 text-xl font-bold mb-3">
                    <div className="grid grid-cols-[2fr_3fr_2fr_2fr_1fr]">
                        <span>Recipe Name</span>
                        <span>Main Ingredients</span>
                        <span>Cuisine</span>
                        <span>Creator</span>
                        <span className="text-right">Actions</span>
                    </div>
                </div>

                {/* Rows */}
                <div className="space-y-3">
                    {visibleRecipes.map((r) => (
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
                                    <ActionIcon size="lg" radius="md" color="dark">
                                        <IconExternalLink size={36} />
                                    </ActionIcon>
                                    <ActionIcon size="lg" radius="md" color="dark">
                                        <IconHeart size={36} />
                                    </ActionIcon>
                                </div>
                            </div>
                        </div>
                    ))}

                    {visibleRecipes.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            No recipes found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function FilterChip({
    label,
    onRemove,
}: {
    label: string;
    onRemove: () => void;
}) {
    return (
        <div className="flex justify-between items-center gap-4 bg-[#E7C6BC] px-2 py-1 rounded-md whitespace-nowrap">
            {label}
            <button onClick={onRemove}>
                <IconX size={24} />
            </button>
        </div>
    );
}
