# Database ERD (v0)

Aşağıda PostgreSQL tablo ve ilişkileri Mermaid diyagramı ile gösterilmiştir.

```mermaid
erDiagram
    RECIPE {
        bigint id PK
        text recipe_title
        text description
        text category
        text subcategory
        int num_steps
        int num_ingredients
    }

    INGREDIENT {
        bigint id PK
        text name
    }

    RECIPE_INGREDIENT {
        bigint recipe_id FK
        bigint ingredient_id FK
        numeric quantity
        text unit
    }

    INSTRUCTION {
        bigint id PK
        bigint recipe_id FK
        int step_number
        text instruction_text
    }

    NUTRITION {
        bigint id PK
        bigint recipe_id FK
        numeric calories
        numeric fat
        numeric protein
        numeric carbs
    }

    TAG {
        bigint id PK
        text tag_name
    }

    RECIPE_TAG {
        bigint recipe_id FK
        bigint tag_id FK
    }

    RECIPE ||--o{ RECIPE_INGREDIENT : contains
    INGREDIENT ||--o{ RECIPE_INGREDIENT : used_in
    RECIPE ||--o{ INSTRUCTION : has
    RECIPE ||--o{ RECIPE_TAG : tagged_with
    TAG ||--o{ RECIPE_TAG : categorizes
    RECIPE ||--o| NUTRITION : has
