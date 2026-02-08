import os
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import importlib
import logging
import sqlite3

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./foodietrack.db",
)

# If using the default sqlite URL, ensure the sqlite file and core table exist
try:
    if DATABASE_URL.startswith("sqlite"):
        # Extract path after the '///'
        if "///" in DATABASE_URL:
            db_path = DATABASE_URL.split("///", 1)[1]
        else:
            db_path = DATABASE_URL
        # Normalize path (strip leading ./)
        db_path = db_path.replace("./", "")
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS preferences (
                id INTEGER PRIMARY KEY,
                user_id TEXT,
                category TEXT DEFAULT 'food',
                preference_type TEXT DEFAULT 'dislike',
                value TEXT,
                metadata JSON,
                created_at TEXT,
                updated_at TEXT
            )
            """
        )
        conn.commit()
        conn.close()
except Exception as e:
    logging.debug(f"Could not ensure sqlite preferences table: {e}")

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db() -> None:
    # Ensure model modules are imported so SQLModel.metadata includes them
    for mod in ("backend.models.preference", "models.preference", "models.preference"):
        try:
            importlib.import_module(mod)
        except Exception:
            logging.debug(f"Could not import model module {mod}")

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session
