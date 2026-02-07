from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from autho import get_current_user_id
from db import get_session
from schemas.preference import PreferenceCreate, PreferenceRead
from services.preference_service import (
    create_preference,
    get_user_preferences,
    get_preference,
    delete_preference,
    update_preference,
)

router = APIRouter(prefix="/preferences", tags=["preferences"])


@router.post("/", response_model=PreferenceRead, status_code=status.HTTP_201_CREATED)
async def add_preference(
    data: PreferenceCreate,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> PreferenceRead:
    pref = await create_preference(session=session, user_id=user_id, data=data)
    return PreferenceRead(**pref.model_dump())


@router.get("/", response_model=List[PreferenceRead])
async def list_preferences(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    prefs = await get_user_preferences(session=session, user_id=user_id)
    return [PreferenceRead(**p.model_dump()) for p in prefs]


@router.get("/export")
async def export_preferences_for_llm(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    """Return preferences formatted for LLM ingestion (JSON)."""
    prefs = await get_user_preferences(session=session, user_id=user_id)
    # Transform preferences into a concise structure for LLMs
    export = {
        "user_id": user_id,
        "preferences": [],
    }
    for p in prefs:
        export["preferences"].append(
            {
                "type": p.preference_type,
                "value": p.value,
                "category": p.category,
                "metadata": p.meta or {},
            }
        )
    return export


@router.put("/{pref_id}", response_model=PreferenceRead)
async def edit_preference(
    pref_id: int,
    data: PreferenceCreate,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    pref = await get_preference(session=session, pref_id=pref_id, user_id=user_id)
    if not pref:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preference not found")
    updated = await update_preference(session=session, pref=pref, data=data.model_dump())
    return PreferenceRead(**updated.model_dump())


@router.delete("/{pref_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_preference(
    pref_id: int,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    pref = await get_preference(session=session, pref_id=pref_id, user_id=user_id)
    if not pref:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preference not found")
    await delete_preference(session=session, pref=pref)
    return None
