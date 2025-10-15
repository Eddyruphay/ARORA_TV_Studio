# test_bot_access.py
# Testa se um bot, usando apenas seu token, consegue ler o histórico de um canal privado do qual é admin.

import os
import asyncio
from telethon.sync import TelegramClient
from telethon.errors import ChannelPrivateError, ChatAdminRequiredError
from dotenv import load_dotenv

# --- Configuração ---
load_dotenv()

API_ID = os.getenv('API_ID')
API_HASH = os.getenv('API_HASH')
BOT_TOKEN = os.getenv('BOT_TOKEN')
HUB_OCI_ID = -1002927656378

async def main():
    print("--- Iniciando Teste de Acesso do Bot ---")
    print(f"Tentando acessar o canal {HUB_OCI_ID} com o token do bot...")

    client = TelegramClient('arora_tv_bot', API_ID, API_HASH)

    try:
        await client.start(bot_token=BOT_TOKEN)
        print("Cliente (BOT) conectado com sucesso.")

        # A tentativa crucial
        messages = await client.get_messages(HUB_OCI_ID, limit=1)
        
        if messages:
            print("\n✅ SUCESSO! O bot conseguiu ler as mensagens do canal.")
            print(f"Conteúdo da última mensagem: {messages[0].text[:80]}...")
        else:
            print("\n⚠️ FALHA! O bot se conectou, mas não conseguiu ler nenhuma mensagem. O canal pode estar vazio ou inacessível.")

    except (ChannelPrivateError, ChatAdminRequiredError) as e:
        print(f"\n❌ FALHA CRÍTICA! O bot não tem permissão para acessar o canal.")
        print(f"Erro do Telegram: {type(e).__name__} - {e}")
        print("Isso confirma que a API de Bots não permite esta operação para canais privados.")
    except Exception as e:
        print(f"\n❌ FALHA INESPERADA! Ocorreu um erro: {e}")
    finally:
        if client.is_connected():
            await client.disconnect()
        print("\n--- Teste Concluído ---")

if __name__ == "__main__":
    if not all([API_ID, API_HASH, BOT_TOKEN]):
        print("ERRO: API_ID, API_HASH, e BOT_TOKEN devem estar no arquivo .env")
    else:
        asyncio.run(main())
