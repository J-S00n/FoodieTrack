"""
Voice analysis service: ElevenLabs Speech-to-Text + Gemini for insights.

Handles transcription, streaming, and exceptions when calling external APIs.
"""

import asyncio
import os

import httpx
from google import genai
from google.genai import types

from schemas.voice import VoiceInsights


# --- Custom Exceptions ---


class VoiceServiceError(Exception):
    """Base exception for voice service failures."""

    pass


class TranscriptionError(VoiceServiceError):
    """ElevenLabs transcription failed."""

    pass


class AnalysisError(VoiceServiceError):
    """Gemini analysis failed."""

    pass


# --- Constants ---

ELEVENLABS_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text"
ELEVENLABS_MODEL = "scribe_v2"
ALLOWED_AUDIO_TYPES = {
    "audio/webm",
    "audio/mp3",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/m4a",
    "audio/x-m4a",
    "audio/mp4",
}
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


# --- Service ---


def _get_elevenlabs_key() -> str:
    key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    if not key:
        raise VoiceServiceError("ELEVENLABS_API_KEY is not configured")
    return key


def _get_gemini_key() -> str:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        raise VoiceServiceError("GEMINI_API_KEY is not configured")
    return key


async def transcribe_audio(audio_bytes: bytes, content_type: str) -> tuple[str, str | None]:
    """
    Send audio to ElevenLabs Speech-to-Text.
    Returns (transcript, language_code).
    """
    api_key = _get_elevenlabs_key()

    files = {"file": ("audio.webm", audio_bytes, content_type)}
    data = {"model_id": ELEVENLABS_MODEL}

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                ELEVENLABS_STT_URL,
                headers={"xi-api-key": api_key, "Accept": "application/json"},
                files=files,
                data=data,
            )
    except httpx.TimeoutException as e:
        raise TranscriptionError("ElevenLabs request timed out") from e
    except httpx.RequestError as e:
        raise TranscriptionError(f"ElevenLabs request failed: {e}") from e

    if response.status_code == 401:
        raise TranscriptionError("Invalid ElevenLabs API key")
    if response.status_code == 429:
        raise TranscriptionError("ElevenLabs rate limit exceeded")
    if response.status_code == 422:
        detail = response.json().get("detail", "Unprocessable audio")
        if isinstance(detail, dict):
            detail = detail.get("message", str(detail))
        raise TranscriptionError(f"Invalid audio: {detail}")
    if response.status_code >= 400:
        raise TranscriptionError(
            f"ElevenLabs error {response.status_code}: {response.text[:500]}"
        )

    body = response.json()
    text = body.get("text", "").strip()
    language_code = body.get("language_code")

    return text, language_code


def _build_gemini_prompt(transcript: str) -> str:
    return f"""Analyze the following transcribed speech from a food/restaurant context.
Return structured insights: sentiment (positive/neutral/negative), user intent, and key terms.

Transcript:
---
{transcript}
---

Focus on food-related intents (ordering, feedback, questions, dietary needs, preferences).
Extract relevant keywords (dishes, ingredients, dietary restrictions, emotions).
Provide a brief summary if the transcript is long or nuanced."""


def _call_gemini_sync(transcript: str) -> VoiceInsights:
    """Synchronous Gemini call (runs in thread pool)."""
    api_key = _get_gemini_key()
    client = genai.Client(api_key=api_key)
    prompt = _build_gemini_prompt(transcript)
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=VoiceInsights.model_json_schema(),
        ),
    )
    if not response or not response.text:
        raise AnalysisError("Gemini returned empty response")
    return VoiceInsights.model_validate_json(response.text)


async def analyze_with_gemini(transcript: str) -> VoiceInsights:
    """Send transcript to Gemini for sentiment, intent, and keyword extraction."""
    try:
        return await asyncio.to_thread(_call_gemini_sync, transcript)
    except Exception as e:
        if isinstance(e, AnalysisError):
            raise
        raise AnalysisError(f"Gemini request failed: {e}") from e


async def process_voice(
    audio_bytes: bytes,
    content_type: str,
    use_gemini: bool = True,
) -> dict:
    """
    Full pipeline: transcribe with ElevenLabs, optionally analyze with Gemini.
    Returns a dict suitable for VoiceAnalysisResponse.
    """
    transcript, language_code = await transcribe_audio(audio_bytes, content_type)

    if not transcript:
        return {
            "transcript": "",
            "sentiment": "neutral",
            "intent": "unclear",
            "keywords": [],
            "summary": None,
            "language_code": language_code,
        }

    if not use_gemini:
        return {
            "transcript": transcript,
            "sentiment": "neutral",
            "intent": "unknown",
            "keywords": [],
            "summary": None,
            "language_code": language_code,
        }

    insights = await analyze_with_gemini(transcript)

    return {
        "transcript": insights.transcript,
        "sentiment": insights.sentiment,
        "intent": insights.intent,
        "keywords": insights.keywords,
        "summary": insights.summary,
        "language_code": language_code,
    }


def validate_audio_input(content_type: str | None, file_size: int) -> None:
    """
    Validate incoming audio before processing.
    Raises ValueError with a descriptive message if invalid.
    """
    if not content_type:
        raise ValueError("Missing Content-Type")

    base_type = content_type.split(";")[0].strip().lower()
    if base_type not in ALLOWED_AUDIO_TYPES:
        raise ValueError(
            f"Unsupported audio format: {content_type}. "
            f"Allowed: {', '.join(sorted(ALLOWED_AUDIO_TYPES))}"
        )

    if file_size <= 0:
        raise ValueError("Audio file is empty")
    if file_size > MAX_FILE_SIZE_BYTES:
        raise ValueError(
            f"Audio file too large (max {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB)"
        )
