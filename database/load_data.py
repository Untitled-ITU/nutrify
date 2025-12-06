import os

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine


load_dotenv("../backend/.env")

DB_PASSWORD = os.getenv("DB_PASSWORD")
CSV_FILENAME = 'recipes.csv'

df = pd.read_csv(CSV_FILENAME)
df_db = df.rename(columns={'ingredients': 'original_ingredients'})

engine = create_engine(f'postgresql://postgres:{DB_PASSWORD}@127.0.0.1:5433/nutrify_db')
df_db.to_sql('recipe', engine, if_exists='replace', index=False)
