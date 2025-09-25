import os
import json
from telethon.sync import TelegramClient

# As credenciais serão injetadas pelo GitHub Actions como variáveis de ambiente
api_id = os.environ.get('API_ID')
api_hash = os.environ.get('API_HASH')
session_name = "arora_tv_bot"

# TODO: Ler canais de um arquivo settings.json
target_channels = ['telegram'] # Canal de exemplo

def main():
    """
    Busca novas mídias nos canais do Telegram e salva os metadados.
    """
    print("Iniciando o script de busca no Telegram...")

    if not api_id or not api_hash:
        print("Erro: As variáveis de ambiente API_ID e API_HASH não foram definidas.")
        return

    # Forçamos o arquivo de sessão a ser salvo no diretório /tmp para evitar problemas de permissão
    session_path = f"/tmp/{session_name}.session"
    print(f"Usando o caminho da sessão: {session_path}")

    # Usamos um bloco with para garantir que o cliente se desconecte corretamente
    with TelegramClient(session_path, api_id, api_hash) as client:
        print(f"Conectado ao Telegram como {session_name}")
        
        all_links = []

        for channel in target_channels:
            print(f"Buscando mensagens no canal: {channel}")
            # TODO: Implementar a lógica de busca de mensagens
            # Exemplo:
            # for message in client.iter_messages(channel, limit=10):
            #     if message.video or message.photo:
            #         link_data = {
            #             "channel": channel,
            #             "message_id": message.id,
            #             "date": message.date.isoformat(),
            #             "text": message.text
            #         }
            #         all_links.append(link_data)

        # Simulação de dados encontrados
        if not all_links:
            print("Nenhuma mídia nova encontrada. Simulando dados para teste.")
            all_links.append({
                "channel": "telegram",
                "message_id": 12345,
                "date": "2025-09-25T10:00:00+00:00",
                "text": "Vídeo de exemplo"
            })

        # Salva os links coletados em data/links.json
        output_path = "data/links.json"
        print(f"Salvando {len(all_links)} links em {output_path}...")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(all_links, f, indent=2, ensure_ascii=False)

    print("Script de busca finalizado com sucesso.")

if __name__ == "__main__":
    main()