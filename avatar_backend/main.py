import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from livekit import api
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt

load_dotenv()

app = FastAPI(title="ZaikaMate Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= CONFIG =================

LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "zaikamate-secret-key-change-this")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Temporary in-memory users for demo only
fake_users_db = {}

# This prevents repeated dispatch calls in one backend runtime
dispatched_rooms = set()


# ================= MODELS =================

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ================= HELPERS =================

def clean_env(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip().strip('"').strip("'")


def check_livekit_env():
    livekit_url = clean_env(LIVEKIT_URL)
    livekit_key = clean_env(LIVEKIT_API_KEY)
    livekit_secret = clean_env(LIVEKIT_API_SECRET)

    missing = []

    if not livekit_url:
        missing.append("LIVEKIT_URL")

    if not livekit_key:
        missing.append("LIVEKIT_API_KEY")

    if not livekit_secret:
        missing.append("LIVEKIT_API_SECRET")

    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Missing environment variables: {', '.join(missing)}"
        )

    if livekit_url.startswith("https://"):
        raise HTTPException(
            status_code=500,
            detail="LIVEKIT_URL is wrong. Use wss://your-project.livekit.cloud, not https://"
        )

    if not livekit_url.startswith("wss://"):
        raise HTTPException(
            status_code=500,
            detail="LIVEKIT_URL must start with wss://"
        )

    if livekit_url.endswith("/"):
        raise HTTPException(
            status_code=500,
            detail="LIVEKIT_URL should not end with /. Remove the last slash."
        )


def create_token(data: dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(days=7)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def make_safe_text(value: str) -> str:
    safe = value.strip().lower()
    safe = safe.replace("@", "_")
    safe = safe.replace(".", "_")
    safe = safe.replace(" ", "_")
    safe = safe.replace("-", "_")

    allowed_chars = "abcdefghijklmnopqrstuvwxyz0123456789_"
    safe = "".join(char for char in safe if char in allowed_chars)

    return safe or "guest"


def make_room_name(identity: str, room: str | None = None, fresh: bool = False) -> str:
    """
    fresh=False:
        Same user gets same room name.
        Good for memory/context.

    fresh=True:
        Creates a new room every time.
        Good for testing stop/start errors.
    """

    if room:
        base_room = make_safe_text(room)
    else:
        safe_identity = make_safe_text(identity)
        base_room = f"zaikamate_{safe_identity}"

    if fresh:
        timestamp = int(datetime.utcnow().timestamp())
        return f"{base_room}_{timestamp}"

    return base_room


async def dispatch_agent_once(final_room: str):
    """
    Dispatches the LiveKit agent only once per room during this backend runtime.
    This helps avoid multiple agents joining the same room when frontend calls
    /get-livekit-token repeatedly.
    """

    if final_room in dispatched_rooms:
        print(f"Agent already dispatched for room: {final_room}")
        return

    lkapi = api.LiveKitAPI(
        url=clean_env(LIVEKIT_URL),
        api_key=clean_env(LIVEKIT_API_KEY),
        api_secret=clean_env(LIVEKIT_API_SECRET),
    )

    try:
        await lkapi.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(
                agent_name="cooking-agent",
                room=final_room,
            )
        )

        dispatched_rooms.add(final_room)
        print(f"Agent dispatched to room: {final_room}")

    except Exception as e:
        error_text = str(e).lower()

        if (
            "already" in error_text
            or "exists" in error_text
            or "duplicate" in error_text
            or "already exists" in error_text
        ):
            dispatched_rooms.add(final_room)
            print(f"Agent already exists for room: {final_room}. Skipping duplicate dispatch.")
        else:
            print(f"Dispatch warning for room {final_room}: {e}")

    finally:
        await lkapi.aclose()


# ================= ROUTES =================

@app.get("/")
def home():
    return {
        "status": "ZaikaMate backend running",
        "livekit_url_exists": bool(clean_env(LIVEKIT_URL)),
        "livekit_key_exists": bool(clean_env(LIVEKIT_API_KEY)),
        "livekit_secret_exists": bool(clean_env(LIVEKIT_API_SECRET)),
    }


@app.post("/signup")
def signup(request: SignupRequest):
    if request.email in fake_users_db:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(request.password)

    fake_users_db[request.email] = {
        "username": request.username,
        "email": request.email,
        "password": hashed_password,
    }

    token = create_token({
        "email": request.email,
        "username": request.username,
    })

    return {
        "message": "Signup successful",
        "token": token,
        "user": {
            "username": request.username,
            "email": request.email,
        }
    }


@app.post("/login")
def login(request: LoginRequest):
    user = fake_users_db.get(request.email)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not pwd_context.verify(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token({
        "email": user["email"],
        "username": user["username"],
    })

    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "username": user["username"],
            "email": user["email"],
        }
    }


@app.get("/get-livekit-token")
async def get_livekit_token(
    identity: str = Query(...),
    room: str | None = Query(None),
    fresh: bool = Query(False),
):
    """
    Use:
    /get-livekit-token?identity=user@example.com

    For testing stop/start issue:
    /get-livekit-token?identity=user@example.com&fresh=true
    """

    check_livekit_env()

    try:
        final_room = make_room_name(identity=identity, room=room, fresh=fresh)

        token = (
            api.AccessToken(
                clean_env(LIVEKIT_API_KEY),
                clean_env(LIVEKIT_API_SECRET),
            )
            .with_identity(identity)
            .with_name(identity)
            .with_grants(
                api.VideoGrants(
                    room_join=True,
                    room=final_room,
                    can_publish=True,
                    can_subscribe=True,
                )
            )
            .to_jwt()
        )

        print(f"Token created")
        print(f"Identity: {identity}")
        print(f"Room: {final_room}")

        await dispatch_agent_once(final_room)

        return {
            "token": token,
            "room": final_room,
            "url": clean_env(LIVEKIT_URL),
            "identity": identity,
            "fresh": fresh,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/clear-dispatched-rooms")
def clear_dispatched_rooms():
    """
    Optional helper for development.
    Call this only during testing if you want backend to allow dispatch again.
    """

    dispatched_rooms.clear()

    return {
        "message": "Dispatched rooms cleared"
    }


if __name__ == "__main__":
    import uvicorn

    print("Starting ZaikaMate backend...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )