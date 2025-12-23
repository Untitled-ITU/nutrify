export const MOCK_RECIPES = [
    {
        id: 245,
        title: "Lentil Soup",
        description:
            "Hearty lentil soup with carrots and tomatoes, comforting and nutritious.",
        category: "soup",
        cuisine: "Middle Eastern",
        meal_type: "dinner",
        created_at: "2025-12-18T21:26:58.897300",
        directions:
            "Heat olive oil in a large pot and saute diced onion, garlic and carrot until softened. Add rinsed lentils and chopped tomato, then cover with water or broth. Bring to a simmer and cook until lentils are tender. Adjust seasoning and serve hot with lemon.",
        author: null,
        ingredients: [
            { id: 34, name: "carrot", quantity: 2, unit: "piece", alternatives: [] },
            { id: 77, name: "garlic", quantity: 2, unit: "piece", alternatives: [] },
            {
                id: 96,
                name: "lentil",
                quantity: 1,
                unit: "cup",
                alternatives: [
                    { quantity: 48, unit: "teaspoon" },
                    { quantity: 16, unit: "tablespoon" },
                ],
            },
            {
                id: 118,
                name: "olive oil",
                quantity: 0.06,
                unit: "cup",
                alternatives: [
                    { quantity: 2.88, unit: "teaspoon" },
                    { quantity: 0.96, unit: "tablespoon" },
                ],
            },
            { id: 119, name: "onion", quantity: 1, unit: "piece", alternatives: [] },
            { id: 166, name: "tomato", quantity: 1, unit: "piece", alternatives: [] },
        ],
        is_favorite: false,
        is_vegan: true,
        is_vegetarian: true,
        in_collections: [],
        ratings: { average: null, count: 0 },
    },

    {
        id: 136,
        title: "Lemon Herb Chicken",
        description: "A bright and simple chicken dish with citrus notes.",
        category: "main dish",
        cuisine: "Mediterranean",
        meal_type: "dinner",
        created_at: "2025-12-18T21:26:58.782338",
        directions:
            "Mix lemon juice, olive oil, garlic, basil, and black pepper in a bowl. Coat chicken and rest for 20 minutes. Heat a pan and cook chicken until golden. Serve warm.",
        author: null,
        ingredients: [
            {
                id: 16,
                name: "basil",
                quantity: 0.06,
                unit: "cup",
                alternatives: [
                    { quantity: 2.88, unit: "teaspoon" },
                    { quantity: 0.96, unit: "tablespoon" },
                ],
            },
            {
                id: 24,
                name: "black pepper",
                quantity: 0.02,
                unit: "cup",
                alternatives: [
                    { quantity: 0.96, unit: "teaspoon" },
                    { quantity: 0.32, unit: "tablespoon" },
                ],
            },
            {
                id: 42,
                name: "chicken breast",
                quantity: 453.59,
                unit: "gram",
                alternatives: [
                    { quantity: 1, unit: "pound" },
                    { quantity: 16, unit: "ounce" },
                ],
            },
            { id: 77, name: "garlic", quantity: 2, unit: "piece", alternatives: [] },
            {
                id: 95,
                name: "lemon juice",
                quantity: 0.19,
                unit: "cup",
                alternatives: [
                    { quantity: 9.12, unit: "teaspoon" },
                    { quantity: 3.04, unit: "tablespoon" },
                ],
            },
            {
                id: 118,
                name: "olive oil",
                quantity: 0.12,
                unit: "cup",
                alternatives: [
                    { quantity: 5.76, unit: "teaspoon" },
                    { quantity: 1.92, unit: "tablespoon" },
                ],
            },
        ],
        is_favorite: false,
        is_vegan: false,
        is_vegetarian: false,
        in_collections: [],
        ratings: { average: null, count: 0 },
    },

    {
        id: 36,
        title: "Ginger Chicken Stir Fry",
        description:
            "Quickly cooked chicken and vegetables tossed in a savory ginger soy sauce.",
        category: "main dish",
        cuisine: "Chinese",
        meal_type: "dinner",
        created_at: "2025-12-18T21:26:58.669321",
        directions:
            "Cut chicken and vegetables into bite-sized pieces. Whisk sauce ingredients together. Stir-fry chicken until browned. Add vegetables and cook briefly. Pour in sauce and cook until thickened. Serve over rice.",
        author: null,
        ingredients: [
            { id: 22, name: "bell pepper", quantity: 1, unit: "piece", alternatives: [] },
            {
                id: 29,
                name: "broccoli",
                quantity: 2,
                unit: "cup",
                alternatives: [
                    { quantity: 96, unit: "teaspoon" },
                    { quantity: 32, unit: "tablespoon" },
                ],
            },
            {
                id: 42,
                name: "chicken breast",
                quantity: 453.59,
                unit: "gram",
                alternatives: [
                    { quantity: 1, unit: "pound" },
                    { quantity: 16, unit: "ounce" },
                ],
            },
            {
                id: 58,
                name: "cornstarch",
                quantity: 0.02,
                unit: "cup",
                alternatives: [
                    { quantity: 0.96, unit: "teaspoon" },
                    { quantity: 0.32, unit: "tablespoon" },
                ],
            },
            { id: 77, name: "garlic", quantity: 2, unit: "piece", alternatives: [] },
            {
                id: 79,
                name: "ginger",
                quantity: 0.06,
                unit: "cup",
                alternatives: [
                    { quantity: 2.88, unit: "teaspoon" },
                    { quantity: 0.96, unit: "tablespoon" },
                ],
            },
            {
                id: 141,
                name: "rice",
                quantity: 2,
                unit: "cup",
                alternatives: [
                    { quantity: 96, unit: "teaspoon" },
                    { quantity: 32, unit: "tablespoon" },
                ],
            },
            {
                id: 150,
                name: "sesame oil",
                quantity: 0.06,
                unit: "cup",
                alternatives: [
                    { quantity: 2.88, unit: "teaspoon" },
                    { quantity: 0.96, unit: "tablespoon" },
                ],
            },
            {
                id: 155,
                name: "soy sauce",
                quantity: 0.25,
                unit: "cup",
                alternatives: [
                    { quantity: 12, unit: "teaspoon" },
                    { quantity: 4, unit: "tablespoon" },
                ],
            },
        ],
        is_favorite: false,
        is_vegan: false,
        is_vegetarian: false,
        in_collections: [],
        ratings: { average: null, count: 0 },
    }, {
        id: 24,
        title: "Spaghetti Carbonara",
        description:
            "Classic Roman pasta with crispy pancetta, eggs, and parmesan in a creamy sauce.",
        directions:
            "Cook spaghetti in salted boiling water until al dente, reserve 1 cup pasta water. Dice pancetta and cook in a large skillet until crispy. Add minced garlic for 30 seconds. In a bowl, whisk eggs with grated parmesan and lots of black pepper. Drain pasta and add to skillet with pancetta. Remove from heat. Quickly toss in egg mixture, adding pasta water to create a creamy sauce. The heat from pasta cooks the eggs. Serve immediately with extra parmesan.",
        directions_steps: [
            "Cook spaghetti in salted boiling water until al dente.",
            "Dice pancetta and cook until crispy.",
            "Add minced garlic for 30 seconds.",
            "Whisk eggs, parmesan, and black pepper.",
            "Combine pasta with pancetta off heat.",
            "Toss in egg mixture and pasta water.",
            "Serve immediately with parmesan.",
        ],
        category: "main dish",
        cuisine: "Italian",
        meal_type: "dinner",
        created_at: "2025-12-18T21:26:58.656377",
        author: null,
        ingredients: [
            {
                id: 24,
                name: "black pepper",
                quantity: 0.04,
                unit: "cup",
                alternatives: [
                    { quantity: 1.92, unit: "teaspoon" },
                    { quantity: 0.64, unit: "tablespoon" },
                ],
            },
            { id: 68, name: "egg", quantity: 4, unit: "piece", alternatives: [] },
            { id: 77, name: "garlic", quantity: 2, unit: "piece", alternatives: [] },
            {
                id: 122,
                name: "pancetta",
                quantity: 226.8,
                unit: "gram",
                alternatives: [
                    { quantity: 0.5, unit: "pound" },
                    { quantity: 8, unit: "ounce" },
                ],
            },
            {
                id: 124,
                name: "parmesan",
                quantity: 1.5,
                unit: "cup",
                alternatives: [
                    { quantity: 72, unit: "teaspoon" },
                    { quantity: 24, unit: "tablespoon" },
                ],
            },
            {
                id: 156,
                name: "spaghetti",
                quantity: 453.59,
                unit: "gram",
                alternatives: [
                    { quantity: 1, unit: "pound" },
                    { quantity: 16, unit: "ounce" },
                ],
            },
        ],
        is_favorite: false,
        is_vegan: false,
        is_vegetarian: false,
        ratings: { average: null, count: 0 },
    },

    {
        id: 98,
        title: "Honey Orange Salmon",
        description:
            "A sweet and citrus-glazed salmon that caramelizes beautifully as it bakes.",
        directions:
            "Mix honey with orange juice, salt, pepper, and oil. Place salmon on a tray and brush with the mixture. Bake at medium heat for about 15-20 minutes, basting halfway through. Remove when the salmon flakes easily with a fork.",
        directions_steps: [
            "Mix honey, orange juice, salt, pepper, and oil.",
            "Brush mixture over salmon.",
            "Bake for 15–20 minutes.",
            "Baste halfway through.",
            "Remove when salmon flakes easily.",
        ],
        category: "main dish",
        cuisine: "American",
        meal_type: "dinner",
        created_at: "2025-12-18T21:26:58.744596",
        author: null,
        ingredients: [
            {
                id: 88,
                name: "honey",
                quantity: 0.12,
                unit: "cup",
                alternatives: [
                    { quantity: 5.76, unit: "teaspoon" },
                    { quantity: 1.92, unit: "tablespoon" },
                ],
            },
            {
                id: 116,
                name: "oil",
                quantity: 0.06,
                unit: "cup",
                alternatives: [
                    { quantity: 2.88, unit: "teaspoon" },
                    { quantity: 0.96, unit: "tablespoon" },
                ],
            },
            { id: 120, name: "orange", quantity: 1, unit: "piece", alternatives: [] },
            {
                id: 131,
                name: "pepper",
                quantity: 0.02,
                unit: "cup",
                alternatives: [
                    { quantity: 0.96, unit: "teaspoon" },
                    { quantity: 0.32, unit: "tablespoon" },
                ],
            },
            { id: 146, name: "salmon", quantity: 3, unit: "piece", alternatives: [] },
            {
                id: 148,
                name: "salt",
                quantity: 0.02,
                unit: "cup",
                alternatives: [
                    { quantity: 0.96, unit: "teaspoon" },
                    { quantity: 0.32, unit: "tablespoon" },
                ],
            },
        ],
        is_favorite: false,
        is_vegan: false,
        is_vegetarian: false,
        ratings: { average: null, count: 0 },
    },
];
