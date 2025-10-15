# Changelog - Protocolo ARORA OCI

## [Versão 1.0.0] - 2025-10-15

### Adicionado
- **Primeira Execução Bem-Sucedida do `ociTG worker`:** O workflow `ociTG worker` foi executado com sucesso, confirmando a funcionalidade do OCI Gateway como proxy, a integração do Telethon e a correta configuração dos segredos. Isso valida a arquitetura "Serverless+ VPN Lógica" para coleta de dados.
- **Aprimoramento do `ociTG_engine`:** O script `ociTG_engine.py` foi aprimorado com a funcionalidade básica de coleta de mensagens de um chat Telegram especificado, incluindo um placeholder para o chat alvo (`TELEGRAM_TARGET_CHAT`) e lógica para buscar as últimas 10 mensagens. Preparação para download de mídia também foi adicionada (comentada).
- **Renomeação do Workflow:** O workflow do GitHub Actions foi renomeado para `ociTG worker`, alinhando-se à nomenclatura do ARORA OCI e à sua função como um worker dedicado ao Telegram.
- **CHANGELOG.md:** Criação do diário de bordo do projeto para rastrear mudanças, aprendizados e decisões arquiteturais.

### Mudanças Arquitetônicas e Estratégicas
- **Escopo do Projeto Refinado para ARORA OCI:** O projeto foi redefinido para ser parte do Observatório de Cultura Imergente (OCI), uma extensão da ARORA focada na coleta e processamento de dados para alimentar o ecossistema ARORA (ARORA TV, ARORA WEAR, ARORA DATA, etc.).
- **Decisão Telethon vs. Puppeteer:** Optou-se por usar Telethon em vez de Puppeteer para a coleta de dados do Telegram. Racional: Telethon oferece maior eficiência (menos consumo de CPU/RAM), estabilidade (interage diretamente com a API do Telegram, menos suscetível a quebras por mudanças na UI) e simplicidade de implementação.
- **Arquitetura "Serverless+ VPN Lógica" Confirmada:** A arquitetura foi validada, com GitHub Actions atuando como o "motor" (fornecendo CPU e largura de banda) e o OCI Gateway (implantado no Render) funcionando como a "VPN de saída" para fornecer um IP estável e desvinculado do GitHub Actions. Isso permite o uso eficiente de recursos gratuitos do GitHub com uma identidade de rede controlada.
- **Seleção de Região do OCI Gateway:** A região de implantação do OCI Gateway no Render será `Ohio (USA - East)`, escolhida para otimizar a proximidade e conectividade com os servidores distribuídos da API do Telegram, minimizando a latência para a coleta de dados.

### Falhas Notáveis e Aprendizados
- **Abordagem Inicial (Puppeteer):** Descartada devido à instabilidade da interface web e alto consumo de recursos. Concluiu-se que o uso de APIs diretas (Telethon) é uma solução mais robusta e eficiente.
- **Desafio de IP (GitHub Actions):** A execução direta de ferramentas como Telethon no ambiente do GitHub Actions mostrou-se inviável devido aos IPs dinâmicos, que são frequentemente bloqueados. Este aprendizado foi o catalisador para a arquitetura "Serverless+ VPN Lógica" com um proxy de egresso, que agora serve como o OCI Gateway.
