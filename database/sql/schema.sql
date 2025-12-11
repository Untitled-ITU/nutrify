CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'consumer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Ingredients Table
CREATE TABLE IF NOT EXISTS ingredient (
    id BIGSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    default_unit TEXT
);

-- 4. Recipes Table
CREATE TABLE IF NOT EXISTS recipe (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    cuisine TEXT,
    meal_type TEXT,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    directions TEXT,
    num_ingredients INT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Recipe-Ingredient Relation
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    recipe_id BIGINT REFERENCES recipe(id) ON DELETE CASCADE,
    ingredient_id BIGINT REFERENCES ingredient(id),
    quantity FLOAT,
    unit TEXT,
    PRIMARY KEY (recipe_id, ingredient_id)
);

-- 6. Meal Plans
CREATE TABLE IF NOT EXISTS meal_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    recipe_id BIGINT REFERENCES recipe(id),
    plan_date DATE NOT NULL,
    meal_type TEXT NOT NULL,
    UNIQUE(user_id, plan_date, meal_type)
);

-- 7. Shopping List
CREATE TABLE IF NOT EXISTS shopping_list (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    ingredient_id BIGINT REFERENCES ingredient(id),
    amount TEXT,
    is_purchased BOOLEAN DEFAULT FALSE,
    source_type TEXT,
    source_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Favorites
CREATE TABLE IF NOT EXISTS favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    recipe_id BIGINT REFERENCES recipe(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id)
);

-- 9. Ratings
CREATE TABLE IF NOT EXISTS ratings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    recipe_id BIGINT REFERENCES recipe(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(user_id, recipe_id)
);

-- 10. Fridge Items
CREATE TABLE IF NOT EXISTS fridge_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    ingredient_id BIGINT REFERENCES ingredient(id) NOT NULL,
    quantity FLOAT,
    unit TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, ingredient_id)
);

-- 11. Verification Codes
CREATE TABLE IF NOT EXISTS verification_codes (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pending_username TEXT,
    pending_password_hash TEXT,
    pending_role TEXT
);
