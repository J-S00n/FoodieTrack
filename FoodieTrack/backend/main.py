from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated, List, Optional
import logging
import os
import snowflake.connector
from datetime import date
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Dict, Any
import json
import google.generativeai as genai
from utils.prompt_builder import build_prompt

load_dotenv()  # loads your .env variables

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

model = genai.GenerativeModel("gemini-2.5-flash")

app = FastAPI()

class RecommendationRequest(BaseModel):
    transcript: str
    preferences: str


# Enable CORS to allow frontend requests
# Update allowed_origins in production with actual domain

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_connection():
    return snowflake.connector.connect(
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
        database=os.getenv("SNOWFLAKE_DATABASE"),
        schema=os.getenv("SNOWFLAKE_SCHEMA"),
        role=os.getenv("SNOWFLAKE_ROLE"),
    )

def query_today():
    """
    Queries the given table and returns rows where day_column equals today.
    """
    today_str = date.today().isoformat()  # 'YYYY-MM-DD'

    sql = f"""
        SELECT *
        FROM menu_items
    """

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(sql)
        rows = cur.fetchall()
        columns = [c[0] for c in cur.description]
        results = [dict(zip(columns, row)) for row in rows]
        return results
    finally:
        cur.close()
        conn.close()

@app.post("/recommendations")
async def recommend(payload: RecommendationRequest):
    try:
        # 1️⃣ Transcript from frontend
        transcript = payload.transcript

        # 2️⃣ Preferences from localStorage
        preferences = payload.preferences

        print("these are the user preferences:", preferences)

        # 3️⃣ Backboard history
        history = {}

        # 4️⃣ Snowflake menu (today only for demo)
        menu_items = query_today() or []

        # 5️⃣ Build Gemini prompt
        prompt = build_prompt(
            transcript=transcript,
            user_preferences=preferences,
            user_history=history,
            menu_data=menu_items,
            is_logged_in=True,
        )

        # 6️⃣ Call Gemini
        response = model.generate_content(prompt)
        text = response.text

        print(text)
        return text

    except Exception as e:
        print("BACKEND ERROR:", e)  # <-- IMPORTANT
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
