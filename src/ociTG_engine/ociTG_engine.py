import os
import json
import asyncio
from telethon.sync import TelegramClient
from telethon.sessions import StringSession
from dotenv import load_dotenv

load_dotenv()

# --- Configuration ---
# Get API ID and API Hash from environment variables or secrets
# You will need to set these in your GitHub Actions secrets or .env file
API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')

# Get session string from environment variable
SESSION_STRING = os.getenv('TELEGRAM_SESSION_JSON')

# Get proxy settings from environment variables
PROXY_URL = os.getenv('HTTPS_PROXY') or os.getenv('HTTP_PROXY')

# --- Main Logic ---
async def main():
    if not API_ID or not API_HASH:
        print("Error: TELEGRAM_API_ID and TELEGRAM_API_HASH must be set.")
        return

    if not SESSION_STRING:
        print("Error: TELEGRAM_SESSION_JSON (decrypted session string) must be set.")
        return

    # Parse the session string (assuming it's a JSON string containing the session)
    try:
        session_data = json.loads(SESSION_STRING)
        # Telethon expects a string session, so we might need to extract it
        # or ensure the decrypted data is directly usable as a StringSession
        # For now, let's assume SESSION_STRING is the actual string session
        # If it's a JSON object with a 'session' key, adjust accordingly:
        # string_session = session_data.get('session', SESSION_STRING)
        string_session = SESSION_STRING # Assuming the decrypted output is the raw string session
    except json.JSONDecodeError:
        print("Error: TELEGRAM_SESSION_JSON is not a valid JSON string.")
        return

    client = None
    try:
        if PROXY_URL:
            print(f"Using proxy: {PROXY_URL}")
            # Telethon expects proxy in (host, port) format, and type
            # This is a simple HTTP/HTTPS proxy, so we'll parse the URL
            from urllib.parse import urlparse
            proxy_parsed = urlparse(PROXY_URL)
            proxy_settings = (proxy_parsed.hostname, proxy_parsed.port, 'http') # Assuming HTTP/HTTPS proxy
            client = TelegramClient(StringSession(string_session), API_ID, API_HASH, proxy=proxy_settings)
        else:
            print("No proxy configured.")
            client = TelegramClient(StringSession(string_session), API_ID, API_HASH)

        print("Connecting to Telegram...")
        await client.connect()

        if not await client.is_user_authorized():
            print("Client is not authorized. Please ensure your session is valid.")
            # In a real scenario, you'd handle re-authentication here.
            # For GitHub Actions, the session string should be pre-generated and valid.
            return

        print("Client authorized successfully!")

        # --- Data Collection Configuration ---
        TARGET_CHAT = os.getenv('TELEGRAM_TARGET_CHAT', 'me') # Default to 'me' for testing
        MESSAGE_LIMIT = int(os.getenv('TELEGRAM_MESSAGE_LIMIT', 10)) # Default to 10 messages
        DOWNLOAD_MEDIA = os.getenv('TELEGRAM_DOWNLOAD_MEDIA', 'false').lower() == 'true'

        print(f"Fetching {MESSAGE_LIMIT} messages from chat: {TARGET_CHAT}")
        print(f"Media download enabled: {DOWNLOAD_MEDIA}")

        collected_messages = []
        try:
            entity = await client.get_entity(TARGET_CHAT)
            async for msg in client.iter_messages(entity, limit=MESSAGE_LIMIT):
                message_info = {
                    'id': msg.id,
                    'date': str(msg.date),
                    'sender_id': msg.sender_id,
                    'text': msg.text,
                    'media': None
                }

                if msg.media and DOWNLOAD_MEDIA:
                    print(f"    Downloading media from message {msg.id}...")
                    media_path = await client.download_media(msg, file=f"./src/ociTG_engine/data/{msg.id}")
                    message_info['media'] = media_path
                
                collected_messages.append(message_info)
                print(f"  Message ID: {msg.id}, Date: {msg.date}, Sender: {msg.sender_id}, Text: {msg.text[:100]}...")

            # Save collected messages to a JSON file
            output_file = f"./src/ociTG_engine/data/{TARGET_CHAT}_messages.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(collected_messages, f, ensure_ascii=False, indent=4)
            print(f"✅ Collected {len(collected_messages)} messages and saved to {output_file}")

        except Exception as e:
            print(f"Error fetching messages from {TARGET_CHAT}: {e}")

        # --- End of data collection logic ---

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if client and client.is_connected():
            print("Disconnecting from Telegram...")
            await client.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
