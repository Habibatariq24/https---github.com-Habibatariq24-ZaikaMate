import uuid
import edge_tts
import os

os.makedirs("audio_responses", exist_ok=True)

async def text_to_speech(text):
    filename = f"{uuid.uuid4()}.mp3"
    filepath = f"audio_responses/{filename}"

    communicate = edge_tts.Communicate(
        text=text,
        voice="en-US-JennyNeural"
    )

    await communicate.save(filepath)

    return filename
