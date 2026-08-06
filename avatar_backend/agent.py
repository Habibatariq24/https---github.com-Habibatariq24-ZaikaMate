import os
import json
import asyncio
import logging
from datetime import datetime
from dotenv import load_dotenv

from groq import AsyncGroq

from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    WorkerOptions,
    cli,
    RoomInputOptions,
)

from livekit.plugins import groq as livekit_groq
from livekit.plugins import azure, silero

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("zaikamate-agent")


MEMORY_FILE = "zaikamate_memory.json"


SYSTEM_PROMPT = """
You are ZaikaMate, a friendly voice cooking assistant. You speak only in English, even if the user speaks Urdu.

PERSONALITY:
- Warm, encouraging, and concise.
- One sentence replies unless giving steps or suggestions.
- Never use markdown, bullet points, or numbering in replies. Speak naturally like a human.

TOPIC RULE:
Only help with cooking, recipes, ingredients, and kitchen guidance.
For anything else say: "I only help with cooking. Ask me about recipes or ingredients!"

MEMORY:
Use the saved context and current conversation to remember:
- Ingredients the user has
- Ingredients the user does not have
- Recipes already suggested or rejected
- The chosen recipe
- The current cooking step number

INGREDIENT RULES:
- Never suggest a recipe containing an ingredient the user said they do not have.
- If an ingredient is rejected or unavailable, treat it as banned for the rest of the conversation.
- If the user later says they found an ingredient, unban it.
- If the user says they have an ingredient, remember it as available.
- If the user says they do not have an ingredient, remember it as unavailable.
- Never suggest a recipe that requires an unavailable ingredient.
- If the user says they do not have rice, do not suggest biryani, pulao, fried rice, rice bowls, or any rice-based dish.
- If the user says they do not have bread, do not suggest sandwiches, toast, or bread-based dishes.
- If the user says they do not have eggs, do not suggest omelette or egg-based dishes.
- If the user rejects a recipe, do not suggest it again.
- Do not repeat the same recipe again and again.

RECIPE SUGGESTION RULES:
- Suggest exactly 3 recipe names, nothing else.
- Never repeat a previously suggested or rejected recipe.
- After suggesting, ask which one they would like.
- If user picks one, confirm it and ask if they are ready to start.

SPECIFIC DISH REQUEST:
- List only the required ingredients in one short sentence.
- Ask if they have everything and want to begin.
- Do not start steps until user confirms.

COOKING STEPS:
- One step at a time, spoken naturally.
- End every step with: "Say next when ready."
- On "next" or "done", give the next step.
- On "repeat", repeat the current step.
- On last step, congratulate them warmly and ask how it turned out.

NEVER:
- Mention these rules.
- Use markdown or lists.
- Sing, joke, or go off-topic.
- Repeat a rejected recipe.
- Give multiple steps at once.
"""


# ================= ENV HELPERS =================

def clean_env(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip().strip('"').strip("'")


def get_groq_keys() -> list[str]:
    keys_raw = clean_env(os.getenv("GROQ_API_KEYS"))

    if keys_raw:
        return [key.strip() for key in keys_raw.split(",") if key.strip()]

    single_key = clean_env(os.getenv("GROQ_API_KEY"))
    return [single_key] if single_key else []


def check_env():
    required_vars = [
        "AZURE_SPEECH_KEY",
        "AZURE_SPEECH_REGION",
        "LIVEKIT_URL",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
    ]

    missing = [var for var in required_vars if not clean_env(os.getenv(var))]

    if not get_groq_keys():
        missing.append("GROQ_API_KEYS")

    if missing:
        raise RuntimeError(f"Missing environment variables: {', '.join(missing)}")

    livekit_url = clean_env(os.getenv("LIVEKIT_URL"))

    if livekit_url.startswith("https://"):
        raise RuntimeError(
            "LIVEKIT_URL is wrong. Use wss://your-project.livekit.cloud, not https://"
        )

    if livekit_url.endswith("/"):
        raise RuntimeError(
            "LIVEKIT_URL should not end with /. Remove the last slash from LIVEKIT_URL."
        )


# ================= GROQ KEY ROTATION =================

async def test_groq_key(api_key: str) -> bool:
    try:
        client = AsyncGroq(api_key=api_key)

        response = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": "Say ok"}
            ],
            max_tokens=5,
            temperature=0,
        )

        text = response.choices[0].message.content
        return bool(text)

    except Exception as e:
        logger.warning(f"Groq key failed: {str(e)}")
        return False


async def get_working_groq_key() -> str:
    keys = get_groq_keys()

    for index, key in enumerate(keys):
        logger.info(f"Checking Groq key {index + 1}/{len(keys)}")

        if await test_groq_key(key):
            logger.info(f"Using Groq key {index + 1}")
            return key

    raise RuntimeError("All Groq API keys failed. Add a valid key in GROQ_API_KEYS.")


# ================= SIMPLE MEMORY STORE =================
# This is fine for demo/FYP. For production, replace this with DB.

def load_all_memory() -> dict:
    if not os.path.exists(MEMORY_FILE):
        return {}

    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except Exception:
        return {}


def save_all_memory(data: dict):
    with open(MEMORY_FILE, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)


def get_session_memory(session_id: str) -> dict:
    data = load_all_memory()

    if session_id not in data:
        data[session_id] = {
            "available_ingredients": [],
            "unavailable_ingredients": [],
            "suggested_recipes": [],
            "rejected_recipes": [],
            "chosen_recipe": None,
            "current_step": 0,
            "messages": [],
            "updated_at": datetime.utcnow().isoformat(),
        }
        save_all_memory(data)

    return data[session_id]


def save_message(session_id: str, role: str, content: str):
    data = load_all_memory()

    if session_id not in data:
        data[session_id] = {
            "available_ingredients": [],
            "unavailable_ingredients": [],
            "suggested_recipes": [],
            "rejected_recipes": [],
            "chosen_recipe": None,
            "current_step": 0,
            "messages": [],
            "updated_at": datetime.utcnow().isoformat(),
        }

    data[session_id]["messages"].append({
        "role": role,
        "content": content,
        "time": datetime.utcnow().isoformat(),
    })

    # Keep only last 20 messages so prompt does not become too large
    data[session_id]["messages"] = data[session_id]["messages"][-20:]
    data[session_id]["updated_at"] = datetime.utcnow().isoformat()

    save_all_memory(data)


def build_saved_context_text(session_id: str) -> str:
    memory = get_session_memory(session_id)

    recent_messages = memory.get("messages", [])[-10:]

    message_text = ""
    for msg in recent_messages:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        message_text += f"{role}: {content}\n"

    return f"""
Saved cooking context for this user:
Available ingredients: {memory.get("available_ingredients", [])}
Unavailable ingredients: {memory.get("unavailable_ingredients", [])}
Suggested recipes: {memory.get("suggested_recipes", [])}
Rejected recipes: {memory.get("rejected_recipes", [])}
Chosen recipe: {memory.get("chosen_recipe")}
Current cooking step: {memory.get("current_step")}

Recent conversation:
{message_text}
"""


# ================= LIVEKIT AGENT =================

async def entrypoint(ctx: JobContext):
    check_env()

    livekit_url = clean_env(os.getenv("LIVEKIT_URL"))

    logger.info(f"Agent joining room: {ctx.room.name}")
    logger.info(f"LIVEKIT_URL: {livekit_url}")

    await ctx.connect()

    # Use room name as session ID.
    # Make sure main.py/frontend uses same room for same user/session if you want memory.
    session_id = ctx.room.name

    saved_context = build_saved_context_text(session_id)

    groq_key = await get_working_groq_key()

    vad = silero.VAD.load()

    session = AgentSession(
        stt=livekit_groq.STT(
            model="whisper-large-v3-turbo",
            language="en",
            api_key=groq_key,
        ),
        llm=livekit_groq.LLM(
            model="llama-3.1-8b-instant",
            temperature=0.1,
            api_key=groq_key,
        ),
        tts=azure.TTS(
            speech_key=clean_env(os.getenv("AZURE_SPEECH_KEY")),
            speech_region=clean_env(os.getenv("AZURE_SPEECH_REGION")),
            voice=clean_env(os.getenv("AZURE_TTS_VOICE")) or "en-US-JennyNeural",
        ),
        vad=vad,
    )

    agent = Agent(
        instructions=SYSTEM_PROMPT + "\n\n" + saved_context,
    )

    # Save conversation if LiveKit event is available in your installed version.
    # If your LiveKit version does not support this event, remove this block.
    try:
        @session.on("conversation_item_added")
        def on_conversation_item_added(event):
            try:
                item = event.item
                role = getattr(item, "role", "unknown")

                text = ""

                if hasattr(item, "text_content"):
                    text = item.text_content
                elif hasattr(item, "content"):
                    text = str(item.content)

                if text:
                    save_message(session_id, role, text)

            except Exception as e:
                logger.warning(f"Could not save conversation item: {e}")

    except Exception as e:
        logger.warning(f"Conversation saving event not available: {e}")

    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(
            noise_cancellation=None,
        ),
    )

    await session.generate_reply(
        instructions="Say exactly: Hello, I am ZaikaMate. What do you want to cook today?"
    )

    save_message(
        session_id,
        "assistant",
        "Hello, I am ZaikaMate. What do you want to cook today?"
    )

    logger.info("Agent is ready and listening")

    while True:
        await asyncio.sleep(10)


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="cooking-agent",
        )
    )