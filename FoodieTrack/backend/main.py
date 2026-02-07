from fastapi import FastAPI, Depends
from typing import Annotated

# Import the Auth0 JWT dependencies & helpers
from autho import get_current_user_id
from routes.voice import router as voice_router

app = FastAPI()
app.include_router(voice_router)

# Example dependency for requiring an authenticated user and extracting their user_id
def require_user(
    user_id: Annotated[str, Depends(get_current_user_id)],
) -> str:
    return user_id

@app.get("/")
def root(user_id: Annotated[str, Depends(require_user)]):
    # user_id is extracted from the validated JWT
    return {"message": f"Hello, user {user_id}!"}
