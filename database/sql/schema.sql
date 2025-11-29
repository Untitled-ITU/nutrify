-- Nutrify Database Schema (PostgreSQL)
-- Updated by: Duru Yılmaz
-- Contains the main tables

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Users Table (Login and roles)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'consumer', -- 'consumer', 'chef' or 'admin'
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
    cuisine TEXT,       
    prep_time INT,      
    cooking_time INT,   
    difficulty TEXT,    
    image_url TEXT,     
    calories INT,       
    protein INT,        
    carbohydrates INT,  
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
    meal_type TEXT NOT NULL, -- 'breakfast', 'lunch', 'dinner'
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
