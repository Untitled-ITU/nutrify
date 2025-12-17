export type Recipe = {
    id: string;
    name: string;
    ingredients: string[];
    cuisine: string;
    creator: string;
};

export type IngredientFilter = {
    type: "include" | "exclude";
    value: string;
};

export type FiltersState = {
    vegetarian: boolean;
    ingredients: IngredientFilter[];
};
