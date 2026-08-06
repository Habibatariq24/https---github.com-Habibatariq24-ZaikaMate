import os
import httpx
from dotenv import load_dotenv
from collections import defaultdict

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# ✅ FIX: add headers
headers = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json",
}

SYSTEM_PROMPT = """
You are a friendly Pakistani cooking assistant.
Keep answers short and helpful.
"""

session_histories = defaultdict(list)


async def ask_llm(user_text: str, session_id: str) -> str:
    history = session_histories[session_id]

    # Add user message
    history.append({"role": "user", "content": user_text})

    # Keep last 10 messages
    trimmed = history[-10:]

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            *trimmed,
        ],
        "temperature": 0.5,
        "max_tokens": 150,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GROQ_URL,
            headers=headers,
            json=payload,
        )

        # ✅ optional safety check (recommended)
        if resp.status_code != 200:
            print("❌ Groq Error:", resp.text)
            return "Sorry, I couldn't process that."

        data = resp.json()

    reply = data["choices"][0]["message"]["content"].strip()

    # Save assistant reply
    history.append({"role": "assistant", "content": reply})

    return reply
