from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class Preference(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    category: Optional[str] = Field(default="food")
    preference_type: str = Field(default="dislike")
    value: str
    # use attribute name `meta` to avoid colliding with SQLAlchemy `metadata` attr
    meta: Optional[dict] = Field(sa_column=Column(JSON, name="metadata"), default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
