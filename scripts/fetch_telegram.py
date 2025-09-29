import os
import json
import asyncio
from telethon.sync import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.types import DocumentAttributeVideo

# --- Configuração ---
API_ID = os.environ.get('API_ID')
API_HASH = os.environ.get('API_HASH')
STRING_SESSION = os.environ.get('TELETHON_STRING_SESSION')
SESSION_NAME = "arora_tv_bot"
SESSION_FILE = f"{SESSION_NAME}.session"

# ID do nosso canal-cofre privado
ARORA_OCI_VAULT_ID = -1002900522511

# Arquivos de dados
SETTINGS_FILE = "data/settings.json"
LINKS_FILE = "data/links.json"
LAST_IDS_FILE = "data/last_ids.json"

def get_video_duration(message):
    """Extrai a duração de um vídeo em segundos."""
    for attr in message.video.attributes:
        if isinstance(attr, DocumentAttributeVideo):
            return attr.duration
    return 0

def load_json(file_path, default_data):
    """Carrega um arquivo JSON de forma segura."""
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return default_data

def save_json(file_path, data):
    """Salva dados em um arquivo JSON."""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

async def main():
    """
    Busca novas mídias, republica no canal-cofre e salva os metadados.
    """
    print("--- Iniciando o script de busca ARORA TV ---")

    # --- Validação de Credenciais ---
    if not all([API_ID, API_HASH]):
        print("Erro: As variáveis de ambiente API_ID e API_HASH não foram definidas.")
        return

    # --- Carregar Configurações ---
    print(f"Carregando configurações de {SETTINGS_FILE}")
    settings = load_json(SETTINGS_FILE, {"source_channels": []})
    source_channels = settings.get("source_channels", [])
    if not source_channels:
        print("Nenhum canal-fonte definido em data/settings.json. Encerrando.")
        return

    last_ids = load_json(LAST_IDS_FILE, {})
    all_new_links = load_json(LINKS_FILE, [])

    # --- Conectar e Processar ---
    # Usa a String Session se disponível, senão, volta para o arquivo de sessão.
    session = StringSession(STRING_SESSION) if STRING_SESSION else SESSION_FILE
    client = TelegramClient(session, API_ID, API_HASH)
    try:
        await client.connect()
        if not await client.is_user_authorized():
            print(f"Erro: A sessão em '{SESSION_FILE}' não está autorizada. Por favor, gere uma nova sessão usando 'generate_session.py'.")
            return
        print("Cliente Telegram conectado com sucesso.")
    except Exception as e:
        print(f"Erro ao conectar ao Telegram ou autorizar sessão: {e}")
        return

    async with client: # Use o cliente já conectado
        for channel in source_channels:
            channel_last_id = last_ids.get(channel, 0)
            print(f"Buscando no canal '{channel}' a partir do ID: {channel_last_id}")
            
            new_messages_in_channel = []
            try:
                # Usamos reverse=True para processar do mais antigo para o mais novo
                async for message in client.iter_messages(channel, min_id=channel_last_id, reverse=True, limit=100):
                    if message.video:
                        print(f"  - Vídeo encontrado: ID {message.id}")
                        
                        # 1. Republicar no nosso canal-cofre
                        forwarded_message = await client.forward_messages(
                            ARORA_OCI_VAULT_ID,
                            messages=message
                        )
                        print(f"    - Republicado no cofre com novo ID: {forwarded_message.id}")

                        # 2. Extrair metadados da nova mensagem
                        duration = get_video_duration(forwarded_message)
                        
                        link_data = {
                            "source_channel": channel,
                            "vault_message_id": forwarded_message.id,
                            "duration_seconds": duration,
                            "processed_at": forwarded_message.date.isoformat()
                        }
                        new_messages_in_channel.append(link_data)
                    
                    # Atualiza o último ID processado para este canal
                    last_ids[channel] = message.id

            except Exception as e:
                print(f"Erro ao processar o canal {channel}: {e}")
                continue # Pula para o próximo canal
            
            if new_messages_in_channel:
                print(f"  - {len(new_messages_in_channel)} novos vídeos do canal '{channel}' foram processados.")
                all_new_links.extend(new_messages_in_channel)
            else:
                print(f"  - Nenhum vídeo novo encontrado no canal '{channel}'.")

    # --- Salvar Resultados ---
    if all_new_links:
        print(f"Salvando {len(all_new_links)} links totais em {LINKS_FILE}")
        save_json(LINKS_FILE, all_new_links)

    print(f"Salvando os últimos IDs processados em {LAST_IDS_FILE}")
    save_json(LAST_IDS_FILE, last_ids)
    
    # --- Limpeza ---
    # Não remove o arquivo de sessão aqui, pois o usuário quer testar sua validade.
    # if os.path.exists(SESSION_FILE):
    #     os.remove(SESSION_FILE)
    #     print(f"Arquivo de sessão local {SESSION_FILE} removido.")

    print("--- Script de busca ARORA TV finalizado ---")

if __name__ == "__main__":
    # O Telethon usa asyncio, então rodamos a função main dentro de um loop de eventos.
    asyncio.run(main())