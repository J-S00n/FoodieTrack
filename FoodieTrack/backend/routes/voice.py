"""
Voice analysis route: accepts audio upload, validates input, returns structured insights.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from autho import get_current_user_id
from schemas.voice import VoiceAnalysisResponse
from services.voice_service import (
    TranscriptionError,
    AnalysisError,
    VoiceServiceError,
    process_voice,
    validate_audio_input,
)

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
