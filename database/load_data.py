import pandas as pd
from sqlalchemy import create_engine

DB_PASSWORD = 'your_password' #enter your real password inside

CSV_FILENAME = 'recipes.csv' 

print("1. Reading the CSV file... (This might take a moment)")
try:

    df = pd.read_csv(CSV_FILENAME)
    
    df_db = df.rename(columns={
        'recipe_title': 'recipe_title',
        'category': 'category',
        'subcategory': 'subcategory',
        'description': 'description',
        'directions': 'directions',
        'num_ingredients': 'num_ingredients',
        'num_steps': 'num_steps',
        'ingredients': 'original_ingredients'
    })

    columns_to_keep = [
        'recipe_title', 'category', 'subcategory', 'description', 
        'directions', 'num_ingredients', 'num_steps', 'original_ingredients'
    ]
    df_final = df_db[columns_to_keep]

    print("2. Connecting to the Database...")

    engine = create_engine('postgresql://postgres:12345@127.0.0.1:5433/nutrify_db')

    print("3. Uploading data to PostgreSQL... (This may take 1-2 minutes)")
    
    df_final.to_sql('recipe', engine, if_exists='append', index=False)

    print("✅ SUCCESS! All recipes have been loaded into the database.")

except Exception as e:
    print(f"❌ AN ERROR OCCURRED:\n{e}")

input("\nPress Enter to exit...")