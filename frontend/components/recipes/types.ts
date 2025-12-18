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
};

export type IngredientFilter = {
    type: "include" | "exclude";
    value: string;
};

export type FiltersState = {
    vegetarian: boolean;
    ingredients: IngredientFilter[];
};
