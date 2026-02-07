"""
Voice analysis route: accepts audio upload, validates input, returns structured insights.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from autho import get_current_user_id
from schemas.voice import VoiceAnalysisResponse
from schemas.preference import PreferenceCreate
from services.voice_service import (
    TranscriptionError,
    AnalysisError,
    VoiceServiceError,
    process_voice,
    validate_audio_input,
)
from db import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from services.preference_service import create_preference
import re
import logging
from metrics import PREFERENCES_EXTRACTED, PREFERENCE_SAVED, PREFERENCE_SAVE_FAILURES

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post(
    "/analyze",
    response_model=VoiceAnalysisResponse,
    summary="Analyze voice audio",
    description="Upload audio for transcription (ElevenLabs) and optional Gemini analysis.",
)
async def analyze_voice(
    user_id: Annotated[str, Depends(get_current_user_id)],
    audio: Annotated[UploadFile, File(description="Audio file (webm, mp3, wav, etc.)")],
    use_gemini: Annotated[bool, Form(description="Run Gemini for sentiment/intent analysis")] = True,
    session: AsyncSession = Depends(get_session),
) -> VoiceAnalysisResponse:
    """
    Accept audio from frontend, transcribe via ElevenLabs, optionally analyze via Gemini.
    Returns structured insights (transcript, sentiment, intent, keywords).
    """
    content_type = audio.content_type or ""
    try:
        body = await audio.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read audio file: {e}",
        ) from e

    file_size = len(body)

    try:
        validate_audio_input(content_type, file_size)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        ) from e

    try:
        result = await process_voice(
            audio_bytes=body,
            content_type=content_type,
            use_gemini=use_gemini,
        )
        # Attempt to extract preferences from transcript/keywords and save them
        try:
            def extract_preferences(transcript: str, intent: str, keywords: list[str]) -> list[dict]:
                prefs: list[dict] = []
                t = (transcript or "").lower()

                # Map explicit dietary tags
                dietary_tags = ["vegan", "vegetarian", "kosher", "halal", "gluten-free", "gluten free", "lactose intolerant"]
                for tag in dietary_tags:
                    if tag in t:
                        val = tag.replace(" ", "-")
                        prefs.append({"preference_type": "restriction", "value": val, "category": "food", "metadata": {"source": "voice"}})

                # Use keywords as candidate food items; look for negative context in transcript
                neg_triggers = ["no ", "don't ", "dont ", "do not ", "avoid ", "allerg", "can't ", "cannot "]
                for kw in keywords:
                    kw_l = kw.lower()
                    # exact negative patterns
                    negative = any(trig + kw_l in t for trig in neg_triggers)
                    # or presence of 'allerg' anywhere plus keyword
                    if ("allerg" in t or "allergy" in t or "allergic" in t) and kw_l in t:
                        prefs.append({"preference_type": "allergy", "value": kw, "category": "food", "meta": {"source": "voice"}})
                        continue
                    if negative:
                        prefs.append({"preference_type": "dislike", "value": kw, "category": "food", "meta": {"source": "voice"}})

                # Try simple pattern: "i don't like X" or "i hate X"
                patterns = [r"i (?:don't|do not|dont) like ([a-zA-Z \-']+)", r"i hate ([a-zA-Z \-']+)", r"i'm allergic to ([a-zA-Z \-']+)", r"i am allergic to ([a-zA-Z \-']+)"]
                for pat in patterns:
                    for m in re.finditer(pat, t):
                        item = m.group(1).strip()
                        if item:
                            ptype = "allergy" if "allerg" in pat or "allergic" in pat else "dislike"
                            prefs.append({"preference_type": ptype, "value": item, "category": "food", "meta": {"source": "voice"}})

                # Deduplicate by (type,value)
                seen = set()
                deduped = []
                for p in prefs:
                    key = (p["preference_type"], p["value"].lower())
                    if key in seen:
                        continue
                    seen.add(key)
                    deduped.append(p)
                return deduped

            prefs = extract_preferences(result.get("transcript", ""), result.get("intent", ""), result.get("keywords", []))
            if prefs:
                PREFERENCES_EXTRACTED.inc(len(prefs))
            logger = logging.getLogger(__name__)
            for p in prefs:
                try:
                    pref_in = PreferenceCreate(**p)
                    await create_preference(session=session, user_id=user_id, data=pref_in)
                    PREFERENCE_SAVED.inc()
                except Exception as exc:
                    PREFERENCE_SAVE_FAILURES.inc()
                    logger.exception("Failed to save preference: %s", exc)
        except Exception:
            # Don't fail the whole request if preference saving fails; log could be added
            pass
        return VoiceAnalysisResponse(**result)
    except TranscriptionError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Transcription failed: {e}",
        ) from e
    except AnalysisError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Analysis failed: {e}",
        ) from e
    except VoiceServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        ) from e
