# Pesquisa da API do Telegram Web - Relatório de Progresso

Este documento serve como um registro das descobertas, obstáculos e progresso na engenharia reversa da API interna do Telegram Web, com o objetivo de construir um "pescador" de conteúdo.

## 1. Autenticação e Sessão

### Descoberta Principal: `localStorage` é a Chave!

Foi identificado que o Telegram Web armazena a maior parte das informações de sessão e autenticação no `localStorage` do navegador. Isso inclui chaves de autenticação (`auth_key`), `server_salt` e informações da conta (`account1`).

**Exemplo de Chaves Encontradas no `localStorage`:**
*   `dc3_auth_key`
*   `dc5_server_salt`
*   `user_auth`
*   `account1` (contendo `dc1_auth_key`, `dc2_auth_key`, etc.)

**Implicação:** Para manter a sessão e realizar chamadas de API, a injeção correta desses valores do `localStorage` é crucial.

### Desafios com Cookies e SessionStorage

A captura de cookies e sessionStorage via Puppeteer tem se mostrado ineficaz, resultando em arquivos vazios. Isso sugere que:
*   O Telegram Web pode não estar utilizando cookies ou sessionStorage para a autenticação principal.
*   A forma como o Puppeteer tenta capturá-los pode não ser compatível com a implementação do Telegram.

**Próximo Passo:** Focar na injeção e utilização dos dados do `localStorage` para autenticação.

## 2. Captura de Requisições de Rede (API Interna)

### **NOVA ESTRATÉGIA: Utilizando Bibliotecas MTProto!**

Uma descoberta crucial da equipe colaboradora revelou que o Telegram Web utiliza o protocolo **MTProto** e que existem bibliotecas JavaScript maduras (`@mtproto/core`, `gram-js/gramjs`) que implementam esse protocolo.

**Isso muda drasticamente nossa abordagem:** Em vez de tentar "pescar" links da interface ou decifrar requisições de rede, vamos usar essas bibliotecas para interagir diretamente com a API do Telegram.

### Plano de Ação Revisado:

1.  **`captura.js` (Registrador de Sessão):**
    *   Navegar para `web.telegram.org`.
    *   Esperar o usuário fazer login (se necessário).
    *   Executar código JavaScript na página (`page.evaluate`) para extrair todas as chaves relevantes do `localStorage` (especialmente as `_auth_key`).
    *   **Encontrar `api_id` e `api_hash`:** Estes valores são essenciais e precisam ser encontrados no código-fonte JavaScript do Telegram Web (procurar por `api_id:` ou `api_hash:` nos arquivos `.js` carregados pela página).
    *   Salvar todas essas informações em `pescadores/data/session.json`.
2.  **`processador.js` (Cliente de API):**
    *   Criar um novo script que irá ler o `session.json`.
    *   Usar o `@mtproto/core` (ou `gram-js/gramjs`) com as chaves extraídas para fazer chamadas de API (ex: `messages.getHistory`, `upload.getFile`) para baixar o conteúdo.

### Obstáculos Anteriores (Superados pela Nova Estratégia):

*   A dificuldade em capturar requisições de rede com payloads completos e identificar a API interna diretamente da interface web é agora contornada pela utilização das bibliotecas MTProto.
*   A lentidão e os problemas com o `git add .` foram resolvidos ao ignorar `node_modules/` e `pescadores/user_data/`.

## 3. Próximos Passos Imediatos

1.  **Atualizar `docs/telegram_api_research.md`:** Incorporar esta nova estratégia e plano de ação. (Este passo está sendo executado agora).
2.  **Refatorar `captura.js`:** Implementar a extração de `localStorage`, `api_id` e `api_hash` e salvá-los em `session.json`.
3.  **Criar `processador.js`:** Desenvolver o script que usará a biblioteca MTProto para interagir com a API.

---
**Data da Última Atualização:** 15 de Outubro de 2025
