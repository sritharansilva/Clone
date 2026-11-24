
import logging
from typing import Annotated
from uuid import UUID

from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from postlight.clients import storage_client


logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)


def current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Security(bearer_scheme)
    ] = None
) -> UUID:

    if credentials is None:
        print("AUTHENTICATION FAILED: No Bearer token received")
        raise HTTPException(401, "Sign in to continue")

    print("AUTHORIZATION HEADER RECEIVED")
    print("TOKEN LENGTH:", len(credentials.credentials))

    try:
        response = storage_client.auth.get_user(
            credentials.credentials
        )

        user = response.user

        if user is None:
            raise ValueError("Supabase returned no user")

        print("SUPABASE USER VERIFIED")

        return UUID(str(user.id))

    except Exception:
        logger.exception("Supabase user verification failed")

        raise HTTPException(
            401,
            "Session verification failed. Check backend terminal."
        ) from None
