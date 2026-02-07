"""
JWT validation for protected FastAPI routes.
Validates JWTs via Auth0 JWKS, extracts user_id from the token,
and exposes FastAPI dependencies for protecting routes.
"""

import os
from typing import Annotated

import jwt  # Make sure you have 'pyjwt' installed: pip install pyjwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# If you get error with 'from jwt import PyJWKClient', it might be because your 'jwt' is not from 'pyjwt'.
# Try explicitly installing pyjwt with keys: pip install "pyjwt[crypto]"

try:
    from jwt import PyJWKClient
except ImportError:
    # Fallback for old pyjwt or mis-installed jwt package
    raise ImportError(
        "Cannot import PyJWKClient. "
        "Make sure you have installed pyjwt (not just 'jwt') with: pip install 'pyjwt[crypto]'"
    )

# Auth0 config – set AUTH0_DOMAIN and AUTH0_AUDIENCE in env
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "").rstrip("/")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "")

# Bearer token scheme – expects: Authorization: Bearer <token>
security = HTTPBearer(auto_error=False)

JWKS_URL = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json" if AUTH0_DOMAIN else ""

_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        if not AUTH0_DOMAIN:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Auth0 is not configured (AUTH0_DOMAIN missing)",
            )
        _jwks_client = PyJWKClient(JWKS_URL)
    return _jwks_client


def verify_token(token: str) -> dict:
    """
    Verify JWT: signature (via JWKS), expiry, issuer, audience.
    Returns the decoded payload on success.
    """
    if not AUTH0_DOMAIN or not AUTH0_AUDIENCE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth0 is not configured (AUTH0_DOMAIN / AUTH0_AUDIENCE)",
        )
    try:
        client = _get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/",
            options={"verify_exp": True},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


def get_user_id_from_payload(payload: dict) -> str:
    """
    Extract user_id from JWT payload.
    Auth0 uses the 'sub' claim (e.g. 'auth0|...' or 'google-oauth2|...').
    """
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing 'sub' claim",
        )
    return sub


def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> str:
    """
    FastAPI dependency: validates JWT on protected routes and returns user_id.

    Usage:
        from backend.autho import get_current_user_id

        @router.get("/me")
        def me(user_id: Annotated[str, Depends(get_current_user_id)]):
            return {"user_id": user_id}
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = verify_token(credentials.credentials)
    return get_user_id_from_payload(payload)


def get_current_user_payload(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> dict:
    """
    FastAPI dependency: validates JWT and returns full payload (sub, aud, iss, exp, etc.).
    Use when you need roles, email, or other claims.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return verify_token(credentials.credentials)
