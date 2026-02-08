import os
import requests
from dotenv import load_dotenv

BACK_URL = BACKBOARD_API_URL
BACK_API_KEY = BACKBOARD_API_KEY
headers = { "Authorization": f"Bearer {BACK_API_KEY}", "Content-Type": "application/json" }

def store_message(user_id, text, metadata):
    payload = {
        "text": text,
        "metadata": {
            "user_id": user_id,
            **metadata
        }
    }

    res = requests.post(
        f"{BACK_URL}/documents",
        json=payload,
        headers=headers
    )
    res.raise_for_status()
    return res.json()

def retrieve_messages(query: str, user_id: str, top_k: int = 10):
    payload = {
        "query": query,
        "filter": {
            "user_id": user_id
        },
        "top_k": top_k
    }
    res = requests.post(
        f"{BACK_URL}/search",
        json=payload,
        headers=headers
    )
    res.raise_for_status()
    return res.json().get("results", [])

def fetch_user_history_for_gemini(user_id: str, limit: int = 10) -> dict:
    """
    Returns structured, Gemini-ready user history.
    This is NOT raw vector search output.
    """

    results = retrieve_messages(
        query="food mood preferences diet",
        user_id=user_id,
        top_k=limit
    )

    history = {
        "recent_statements": [],
        "dietary_constraints": set(),
        "avoided_foods": set(),
        "mood_food_patterns": []
    }

    for r in results:
        text = r.get("text", "")
        meta = r.get("metadata", {})

        history["recent_statements"].append(text)

        if "dietary_constraints" in meta:
            history["dietary_constraints"].update(meta["dietary_constraints"])

        if "avoid" in meta:
            history["avoided_foods"].update(meta["avoid"])

        if "mood" in meta and "food" in meta:
            history["mood_food_patterns"].append({
                "mood": meta["mood"],
                "food": meta["food"]
            })

    # Convert sets → lists (JSON safe)
    history["dietary_constraints"] = list(history["dietary_constraints"])
    history["avoided_foods"] = list(history["avoided_foods"])

    return history
