from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
import json

from autho import get_current_user_id
from services.gemini_client import model
from utils.prompt_builder import build_prompt
from services.backboard_client import fetch_user_history_for_gemini
from db import query_today

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post("")
async def recommend(
    payload: dict,
    user_id: Annotated[str, Depends(get_current_user_id)],
):
    try:
        # 1️⃣ Transcript from frontend
        transcript = payload["transcript"]

        # 2️⃣ Preferences from localStorage
        preferences = payload.get("preferences", {})

        # 3️⃣ Backboard history
        #history = fetch_user_history_for_gemini(user_id)
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

        # 7️⃣ Parse JSON
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Gemini returned invalid JSON",
                    "raw": text,
                },
            )

    except KeyError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Missing field: {e}",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
