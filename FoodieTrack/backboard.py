import requests

BACKBOARD_URL = "https://api.backboard.io/v1"
BACKBOARD_API_KEY = "espr_-tj2s6buTGB1VyIkHTqBoHO5-X6yBkk418bHCmw4GRw"
headers = { "Authorization": f"Bearer {BACKBOARD_API_KEY}", "Content-Type": "application/json" }

def store_message(user_id, text, metadata):
    payload = {
        "text": text,
        "metadata": {
            "user_id": user_id,
            **metadata
        }
    }
    requests.post("https://api.backboard.io/v1/documents", json=payload)

    res = requests.post(
        f"{BACKBOARD_URL}/documents",
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
        f"{BACKBOARD_URL}/search",
        json=payload,
        headers=headers
    )
    res.raise_for_status()
    return res.json().get("results", [])
