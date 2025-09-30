#!/bin/bash
set -e

LINKS_FILE="data/links.json"
SCHEDULE_FILE="data/schedule.json"

# Verifica se o links.json existe e não está vazio
if [ ! -s "$LINKS_FILE" ]; then
    echo "Nenhum link novo para processar em $LINKS_FILE. Encerrando."
    exit 0
fi

# Garante que o schedule.json exista e seja um array JSON válido
if [ ! -f "$SCHEDULE_FILE" ]; then
    echo "[]" > "$SCHEDULE_FILE"
fi

echo "--- Iniciando processamento e upload de novos vídeos ---"

# Prepara um array JSON temporário para os novos itens do agendamento
new_schedule_items="[]"

# Itera sobre cada objeto no array do links.json usando 'jq'
# O 'while read' lê cada linha de output do jq
jq -c '.[]' "$LINKS_FILE" | while read -r link_item; do
    LOCAL_PATH=$(echo "$link_item" | jq -r '.local_path')
    
    # Validação extra do caminho local
    if [ -z "$LOCAL_PATH" ] || [ ! -f "$LOCAL_PATH" ]; then
        echo "  - AVISO: Caminho inválido ou arquivo não encontrado: '$LOCAL_PATH'. Pulando."
        continue
    fi

    FILENAME=$(basename "$LOCAL_PATH")

    echo "Processando: $LOCAL_PATH"

    # 1. Upload
    echo "  - Fazendo upload de $FILENAME..."
    gh release upload media-assets "$LOCAL_PATH" --clobber # --clobber para sobrescrever se já existir
    
    # 2. Obter URL Pública
    echo "  - Obtendo URL pública..."
    # A URL correta para download direto é a 'browserDownloadUrl'
    PUBLIC_URL=$(gh release view media-assets --json assets --jq ".assets[] | select(.name == \"$FILENAME\") | .browserDownloadUrl")

    if [ -z "$PUBLIC_URL" ]; then
        echo "  - ERRO: Não foi possível obter a URL para $FILENAME. Pulando."
        continue
    fi
    echo "  - URL: $PUBLIC_URL"

    # 3. Adiciona a URL ao item e o prepara para o schedule.json
    item_with_url=$(echo "$link_item" | jq --arg url "$PUBLIC_URL" '. + {url: $url} | del(.local_path)') # Remove o caminho local
    
    # Adiciona o item atualizado ao nosso array de novos itens
    new_schedule_items=$(echo "$new_schedule_items" | jq --argjson item "$item_with_url" '. + [$item]')
done

# Verifica se algum item foi processado
if [ "$(echo "$new_schedule_items" | jq 'length')" -eq 0 ]; then
    echo "Nenhum item foi processado com sucesso."
else
    # Adiciona os novos itens ao início do schedule.json
    echo "Atualizando $SCHEDULE_FILE..."
    # Usar -s (slurp) para ler os dois arrays (novos e antigos) em um único array no jq
    jq -s '.[0] + .[1]' <(echo "$new_schedule_items") "$SCHEDULE_FILE" > tmp.$$.json && mv tmp.$$.json "$SCHEDULE_FILE"
    echo "$SCHEDULE_FILE atualizado."
fi

# Limpa o links.json para a próxima execução
echo "Limpando $LINKS_FILE."
echo "[]" > "$LINKS_FILE"

# Opcional: remove a pasta de downloads temporários
if [ -d "temp_downloads" ]; then
    echo "Removendo pasta de downloads temporários."
    rm -rf "temp_downloads"
fi

echo "--- Processo de upload finalizado ---"
