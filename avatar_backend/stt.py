import os
import tempfile
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions"

async def speech_to_text(file):
    # FIX: change extension to .webm
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        temp_path = tmp.name
        tmp.write(await file.read())

    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
    data = {"model": "whisper-large-v3-turbo"}

    with open(temp_path, "rb") as audio:
        # FIX: match filename with .wav
        files = {"file": ("audio.wav", audio)}

        async with httpx.AsyncClient() as client:
            resp = await client.post(GROQ_URL, headers=headers, data=data, files=files)
            result = resp.json()

    os.remove(temp_path)

    return result.get("text", "").strip()
