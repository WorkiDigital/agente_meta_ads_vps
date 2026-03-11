---
name: cerebro-coordenacao
description: Núcleo de orquestração do Agente Estrategista, gerenciando atendimento via WhatsApp e execução de comandos.
---

# 🧠 Coordenação e Atendimento (Cérebro)

O Cérebro é o ponto central de entrada e saída do ecossistema. Ele ouve as demandas via WhatsApp, processa a intenção do usuário e decide quais outras habilidades acionar.

## 🛠️ Tecnologias
- **Evolution API**: Gateway para integração com o WhatsApp.
- **Node.js (webhook.js)**: Servidor que recebe e processa eventos em tempo real.
- **Claude Code CLI**: Orquestrador de inteligência que roda comandos no terminal.

## 📁 Componentes Principais
- `skills/cerebro-coordenacao/scripts/webhook.js`
- `skills/cerebro-coordenacao/scripts/start.js`

## 📡 Funcionamento
1. **Escuta**: O `webhook.js` recebe mensagens via `MESSAGES_UPSERT`.
2. **Triagem**: Valida se o número é autorizado.
3. **Execução**: Invoca o Claude Code para processar a lógica de marketing e executar scripts.
4. **Feedback**: Envia status de "digitando" ou "gravando áudio" enquanto processa.

## ⚙️ Configurações
- Gerenciamento de sessões via `wrkcode`.
- Variáveis de ambiente no `.env` do `whatsapp-bot`.
