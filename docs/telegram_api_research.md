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

### Progresso

A lógica de captura de rede no `captura.js` foi aprimorada para usar `page.on('response')` e filtrar requisições que se assemelham a chamadas da API do Telegram (URLs contendo `/apiid/` ou `/api/` no domínio `web.telegram.org`) e tipos de mídia (`.mp4`, `.m3u8`, etc.).

### Obstáculos Atuais

Apesar dos aprimoramentos, o `network_log.json` ainda não está capturando as requisições da API do Telegram com seus payloads de forma abrangente. As entradas atuais são limitadas a recursos estáticos.

**Possíveis Causas:**
*   O filtro de URL pode não ser abrangente o suficiente.
*   A forma como o Telegram Web faz suas chamadas de API pode ser mais complexa (ex: WebSockets, Service Workers, ou um formato de URL diferente).
*   Pode haver um problema na leitura do corpo da resposta para requisições da API.

**Próximo Passo:** Realizar uma nova sessão de captura interativa com o `captura.js` aprimorado, com foco em gerar tráfego de API e observar o `network_log.json` resultante.

## 3. Próximos Passos Propostos

1.  **Executar nova sessão de captura:** Com o `captura.js` atualizado, realizar uma nova sessão de 15 minutos, focando em interações que gerem muitas chamadas de API (rolar histórico, abrir vídeos, pesquisar).
2.  **Analisar `network_log.json`:** Após a captura, analisar cuidadosamente o `network_log.json` para identificar padrões de chamadas de API, URLs, métodos e payloads.
3.  **Identificar o Objeto da API:** Com base nas requisições de rede, tentar identificar o objeto JavaScript global que o Telegram Web usa para fazer suas chamadas de API.

---
**Data da Última Atualização:** 15 de Outubro de 2025
