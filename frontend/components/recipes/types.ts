export type Recipe = {
    id: number;
    title: string;
    cuisine: string;
    category: string;
    description: string;
    num_ingredients: number;
    created_at: string;
    average_rating: number;
    rating_count: number;
    is_favorite?: boolean;
    image_url?: string;
};

export type Ingredient = {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    alternatives: string[];
};

export type RecipeDetails = {
    author: {
        id: number;
        username: string;
    };
    id: number;
    title: string;
    description: string;
    directions: string;

    cuisine: string;
    category: string;
    meal_type: string;

    created_at: string;

    ingredients: Ingredient[];

    is_vegan: boolean;
    is_vegetarian: boolean;
    is_favorite: boolean;
    image_url: string;
};

export type IngredientFilter = {
    type: "include" | "exclude";
    value: string;
};

export type FiltersState = {
    vegetarian: boolean;
    vegan: boolean;
    ingredients: IngredientFilter[];
    excluded_ingredients: string[];
    cuisines: string[];
    categories: string[];
};

export type Collection = {
    id: number;
    name: string;
    description?: string;
    is_public: boolean;
    recipe_count: number;
    created_at: string;
    updated_at: string;
    recipes: Recipe[];
};

export function mapRecipeDetailsToRecipe(
    details: RecipeDetails
): Recipe {
    return {
        id: details.id,
        title: details.title,
        cuisine: details.cuisine,
        category: details.category,
        description: details.description,
        created_at: details.created_at,

        num_ingredients: details.ingredients.length,

        // we set safe defaults
        average_rating: 0,
        rating_count: 0,
    };
}
