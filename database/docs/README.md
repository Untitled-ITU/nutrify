# Database ERD (v0)

The PostgreSQL tables and their relationships are shown below using a Mermaid diagram.

erDiagram
    USERS {
        BIGSERIAL id PK
        TEXT username
        TEXT email "UNIQUE"
        TEXT password_hash
        TEXT role
        TIMESTAMP created_at
    }

    INGREDIENT {
        BIGSERIAL id PK
        TEXT name "UNIQUE"
        TEXT default_unit
    }

    RECIPE {
        BIGSERIAL id PK
        BIGINT author_id FK
        TEXT title
        TEXT description
        TEXT category
        TEXT cuisine
        TEXT meal_type
        BOOLEAN is_vegan
        BOOLEAN is_vegetarian
        TEXT directions
        INT num_ingredients
        TEXT image_url
        TIMESTAMP created_at
    }

    RECIPE_INGREDIENTS {
        BIGINT recipe_id PK, FK
        BIGINT ingredient_id PK, FK
        FLOAT quantity
        TEXT unit
    }

    MEAL_PLANS {
        BIGSERIAL id PK
        BIGINT user_id FK
        BIGINT recipe_id FK
        DATE plan_date
        TEXT meal_type
        %% UNIQUE(user_id, plan_date, meal_type)
    }

    SHOPPING_LIST {
        BIGSERIAL id PK
        BIGINT user_id FK
        BIGINT ingredient_id FK
        TEXT amount
        BOOLEAN is_purchased
        TEXT source_type
        BIGINT source_id
        TIMESTAMP created_at
    }

    FAVORITES {
        BIGSERIAL id PK
        BIGINT user_id FK
        BIGINT recipe_id FK
        TIMESTAMP created_at
        %% UNIQUE(user_id, recipe_id)
    }

    RATINGS {
        BIGSERIAL id PK
        BIGINT user_id FK
        BIGINT recipe_id FK
        INTEGER score "1..5"
        TEXT comment
        TIMESTAMP created_at
        TIMESTAMP updated_at
        %% UNIQUE(user_id, recipe_id)
    }

    FRIDGE_ITEMS {
        BIGSERIAL id PK
        BIGINT user_id FK
        BIGINT ingredient_id FK
        FLOAT quantity
        TEXT unit
        TIMESTAMP added_at
        %% UNIQUE(user_id, ingredient_id)
    }

    VERIFICATION_CODES {
        BIGSERIAL id PK
        TEXT email
        VARCHAR code "len=6"
        TEXT purpose
        TIMESTAMP expires_at
        BOOLEAN used
        TIMESTAMP created_at
        TEXT pending_username
        TEXT pending_password_hash
        TEXT pending_role
    }

    CHEF_PROFILES {
        BIGSERIAL id PK
        BIGINT user_id FK "UNIQUE"
        TEXT bio
        TEXT website
        TEXT location
        TEXT avatar_url
    }

    USERS ||--o{ RECIPE : authors
    RECIPE ||--o{ RECIPE_INGREDIENTS : contains
    INGREDIENT ||--o{ RECIPE_INGREDIENTS : used_in

    USERS ||--o{ MEAL_PLANS : plans
    RECIPE ||--o{ MEAL_PLANS : scheduled_recipe

    USERS ||--o{ SHOPPING_LIST : has
    INGREDIENT ||--o{ SHOPPING_LIST : item

    USERS ||--o{ FAVORITES : saves
    RECIPE ||--o{ FAVORITES : favorited

    USERS ||--o{ RATINGS : writes
    RECIPE ||--o{ RATINGS : receives

    USERS ||--o{ FRIDGE_ITEMS : stores
    INGREDIENT ||--o{ FRIDGE_ITEMS : stored_item

    USERS ||--|| CHEF_PROFILES : profile
