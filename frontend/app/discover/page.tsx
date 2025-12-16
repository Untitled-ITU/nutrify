"use client";

import { useEffect, useState } from "react";
import { RecipeExplorer } from "@/components/recipes/RecipeExplorer";
import { Recipe } from "@/components/recipes/types";

export default function DiscoverPage() {
    const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);

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

    return (
        <div className="w-full">
            <h1 className="text-4xl font-bold mb-8">
                Discover New Recipes
            </h1>

            <RecipeExplorer recipes={allRecipes} />
        </div>
    );
}
