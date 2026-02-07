"""
Pydantic models for voice analysis request/response.
"""

from pydantic import BaseModel, Field
from typing import Literal


class VoiceInsights(BaseModel):
    """Structured insights from voice transcription and Gemini analysis."""

    transcript: str = Field(description="The transcribed text from the audio.")
    sentiment: Literal["positive", "neutral", "negative"] = Field(
        description="Overall emotional tone of the speech."
    )
    intent: str = Field(description="Detected user intent (e.g., food order, feedback, question).")
    keywords: list[str] = Field(
        default_factory=list,
        description="Key terms or phrases extracted from the transcript.",
    )
    summary: str | None = Field(
        default=None,
        description="Optional brief summary of what was said.",
    )


class VoiceAnalysisResponse(BaseModel):
    """Response returned to the frontend after voice analysis."""

    transcript: str
    sentiment: str
    intent: str
    keywords: list[str]
    summary: str | None
    language_code: str | None = None
