# ARORA TV Studio

Bem-vindo ao ARORA TV Studio! Este projeto é a base para a **televisão online ARORA TV**, utilizando automação, integração com Telegram e workflow do Jarvis 2 via GitHub Actions.

---

## 📂 Estrutura do Projeto

- **src/**: Código do site e player de vídeo  
- **scripts/**: Scripts para automação e transcodificação, como fetch_telegram.py  
- **workflows/**: GitHub Actions YAML para automação diária  
- **docs/**: Documentação adicional do projeto  
- **data/**: Grade de programação (`schedule.json`) e links coletados do Telegram  

---

## ⚙️ Arquitetura

1. **Automação via Jarvis 2**  
   - O Jarvis 2 roda no GitHub Actions e executa tarefas como:  
     - Atualizar grade de programação  
     - Inserir links de vídeos coletados do Telegram  
     - Controlar pop-ups e intervalos comerciais  
     - Limpar conteúdo antigo automaticamente

2. **Integração com Telegram**  
   - Scripts em Python usando **Telethon** para buscar vídeos em canais públicos  
   - Salva metadados e links em `data/links.json`  
   - Pronto para processamento pelo Jarvis 2

3. **Streaming e Conteúdo Dinâmico**  
   - Player do site consome links diretos ou embeds do Telegram  
   - Pop-ups curtos para anunciar próximos episódios ou intervalos comerciais  
   - Conteúdo antigo é apagado automaticamente para economizar armazenamento

---

## 📝 Scripts Importantes

- `scripts/fetch_telegram.py`: Coleta links e metadados de canais públicos  
- `scripts/deploy.sh` *(opcional)*: Script para deploy automático da programação  

---

## 📊 Fluxo do Conteúdo

1. Coleta vídeos e metadados do Telegram  
2. Salva em `data/links.json`  
3. Jarvis 2 lê os links e atualiza a programação do site  
4. O player exibe o conteúdo atual e permite acesso a episódios anteriores  
5. Pop-ups e intervalos são gerenciados automaticamente  
6. Conteúdo antigo é removido conforme configuração

---

## 🔒 Segurança e Boas Práticas

- Todos os tokens e credenciais devem ser armazenados em **GitHub Secrets**  
- Nunca commit tokens ou dados sensíveis no repositório  
- Operações automáticas devem sempre validar a origem do conteúdo  

---

## 🚀 Próximos Passos

- Expandir scripts para suportar múltiplos canais e categorias  
- Integrar melhor pop-ups e programação dinâmica  
- Estudar formas de armazenamento econômico para streaming contínuo  

---

**ARORA TV Studio** - Construindo uma experiência de TV online inovadora, automatizada e interativa.