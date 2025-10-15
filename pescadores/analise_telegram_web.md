# Relatório de Análise e Estratégia - Telegram Web

## 1. Resumo da Missão

Análise do comportamento do Telegram Web para viabilizar a automação da extração de dados de forma não interativa, focando em autenticação, APIs e estrutura da página.

## 2. Processo de Autenticação

*   **Descrição do Login:** O usuário abriu o navegador, inseriu o número de telefone, recebeu um código no aplicativo, digitou o código e, possivelmente, a senha de autenticação de dois fatores (2FA) para acessar a lista de chats.
*   **Análise do Artefato de Sessão (`telegram_session.json`):**
    *   **Cookies Essenciais:** Nenhum cookie de sessão crucial foi capturado, indicando que a versão "A" do Telegram Web depende primariamente de outros mecanismos.
    *   **LocalStorage:** Esta é a parte mais importante da sessão. Encontramos chaves críticas:
        *   `dc4_auth_key`: A chave de autorização para o Data Center 4.
        *   `user_auth`: Contém o `dcID`, vinculando o usuário ao Data Center correto.
        *   `account1`: Um objeto JSON com detalhes do usuário, incluindo `userId` e a chave de autorização novamente.
    *   **Conclusão:** A sessão é mantida pelo `localStorage`. A injeção bem-sucedida desses dados provou ser eficaz para o login automatizado.

## 3. Análise da API (Endpoints)

A análise da navegação manual produziu um log de rede rico, revelando os principais endpoints que o Telegram Web utiliza para suas operações. Todos os endpoints seguem o padrão `https://web.telegram.org/api/v1/METHOD_NAME`.

*   **Endpoints Identificados (`network_log.json`):**
    *   `messages.getHistory`: Busca o histórico de mensagens de um chat.
    *   `messages.search`: Realiza buscas por texto dentro de um chat.
    *   `channels.getMessages`: Busca mensagens de um canal específico.
    *   `upload.getFile`: Obtém metadados e URLs de download para arquivos (vídeos, imagens, etc.).
    *   `users.getUsers`: Obtém informações de perfis de usuários.
    *   `messages.getChats`: Obtém informações sobre chats.

*   **Análise Funcional:**
    *   `messages.getHistory`: Este é o endpoint mais crítico para a extração de dados. A automação deve chamá-lo repetidamente, usando o parâmetro `offset_id` com o ID da última mensagem obtida para paginar através de todo o histórico de um chat.
    *   `upload.getFile`: Essencial para baixar mídias. A automação deve primeiro obter a `location` do arquivo a partir de uma mensagem (via `getHistory`) e então chamar este endpoint para receber a URL de download real.
    *   `messages.search`: Pode ser usado para encontrar mensagens específicas que contenham links ou palavras-chave, tornando a extração mais direcionada.

*   **Conclusão da API:** A extração de dados robusta não deve se basear em "rolar a página" (scrolling), mas sim em interagir diretamente com esses endpoints da API. O fluxo seria:
    1.  Obter a lista de chats.
    2.  Para cada chat, usar `messages.getHistory` para percorrer as mensagens.
    3.  Analisar as mensagens em busca de links ou mídias.
    4.  Se uma mídia for encontrada, usar `upload.getFile` para obter a URL de download.

## 4. Estrutura do DOM e Seletores

*   **Seletores Validados:**
    *   `CHAT_LIST_ITEM_SELECTOR`: O seletor `div.chat-list .ListItem.Chat` provou ser eficaz para detectar o login bem-sucedido.
    *   `MESSAGE_ITEM_SELECTOR`: A validação continua pendente, pois a extração de dados deve focar na API, e não na análise do DOM para mensagens.
*   **Recomendações:** Para uma automação robusta, deve-se minimizar a dependência de seletores do DOM e priorizar a comunicação direta com a API, que é menos suscetível a quebrar com mudanças visuais no site.

## 5. Estratégia para Automação Futura (Não-Interativa)

Para executar o script em um ambiente não interativo (como GitHub Actions), a seguinte abordagem deve ser usada:

1.  **Armazenar a Sessão:** O conteúdo completo do `telegram_session.json` deve ser salvo como um "Secret" no GitHub (por exemplo, com o nome `TELEGRAM_SESSION_JSON`).
2.  **Injetar a Sessão:** O script `captura.js` já possui a lógica funcional para ler e injetar a sessão, aguardando o Service Worker e recarregando a página.
3.  **Interação com a API:** Em vez de simular cliques e rolagem, o script deve ser modificado para usar `page.evaluate()` ou `page.exposeFunction()` para chamar diretamente os métodos da API do Telegram (como `messages.getHistory` e `upload.getFile`) usando os dados da sessão autenticada. Isso torna a extração de dados muito mais rápida, eficiente e confiável.

*   **Exemplo de Código para Injeção de Sessão:**
    ```javascript
    // A lógica implementada no captura.js (v3) provou ser funcional.
    // A função injectSession() e a sequência de `goto`, `injectSession`, `reload`
    // no `main` são o caminho a seguir.
    ```