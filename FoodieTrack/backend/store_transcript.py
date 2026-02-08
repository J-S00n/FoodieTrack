from fastapi import APIRouter
from pydantic import BaseModel
from .backboard import store_message

router = APIRouter()

class TranscriptPayload(BaseModel):
    user_id: str
    text: str
    metadata: dict = {}

@router.post("/store-transcript")
def store_transcript(payload: TranscriptPayload):
    return store_message(
        user_id=payload.user_id,
        text=payload.text,
        metadata=payload.metadata
    )
