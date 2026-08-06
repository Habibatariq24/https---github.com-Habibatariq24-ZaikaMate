from elevenlabs.client import ElevenLabs

client = ElevenLabs(
    api_key="sk_645c0525172b069310e2c9cca57d59ae400cbd61eab42535"
)

audio = client.text_to_speech.convert(
    voice_id="l4Coq6695JDX9xtLqXDE",
    model_id="eleven_multilingual_v2",
    text="Hello! This is a test from ElevenLabs."
)

with open("output.mp3", "wb") as f:
    f.write(audio)

print("Audio saved as output.mp3")