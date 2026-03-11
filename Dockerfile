# Dockerfile - Agente Meta Ads VPS
# Data: 11/03/2026

FROM node:20-slim

# Instala dependências básicas para o Sharp e outras libs nativas
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Prepara o diretório de trabalho com as permissões corretas
RUN mkdir -p /app && chown -R node:node /app

WORKDIR /app

# Copia arquivos de dependências
COPY --chown=node:node package*.json ./

# Instala dependências e o Claude Code CLI
RUN npm install && npm install -g @anthropic-ai/claude-code

# Copia o restante do código com as permissões do usuário node
COPY --chown=node:node . .

# Troca para o usuário node (não-root) para o Claude aceitar as permissões
USER node

# Expõe a porta do Webhook
EXPOSE 3000

# Comando para iniciar o webhook
CMD ["node", "skills/cerebro-coordenacao/scripts/webhook.js"]
