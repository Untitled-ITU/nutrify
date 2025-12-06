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
    name TEXT UNIQUE NOT NULL
);

-- 4. Recipes Table
CREATE TABLE IF NOT EXISTS recipe (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT REFERENCES users(id),
    recipe_title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    subcategory TEXT,
    directions TEXT,
    num_ingredients INT,
    num_steps INT,
    image_url TEXT,
    original_ingredients TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Recipe-Ingredient Relation
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    recipe_id BIGINT REFERENCES recipe(id) ON DELETE CASCADE,
    ingredient_id BIGINT REFERENCES ingredient(id),
    quantity TEXT,
    PRIMARY KEY (recipe_id, ingredient_id)
);

-- 6. Meal Plans
CREATE TABLE IF NOT EXISTS meal_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    recipe_id BIGINT REFERENCES recipe(id),
    plan_date DATE NOT NULL,
    meal_type TEXT NOT NULL,
    UNIQUE(user_id, plan_date, meal_type)
);

-- 7. Shopping List
CREATE TABLE IF NOT EXISTS shopping_list (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    ingredient_id BIGINT REFERENCES ingredient(id),
    amount TEXT,
    is_purchased BOOLEAN DEFAULT FALSE
);

-- 8 Verification Codes
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
