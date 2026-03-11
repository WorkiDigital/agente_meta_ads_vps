# Dockerfile - Agente Meta Ads VPS
# Data: 11/03/2026

FROM node:20-slim

# Instala dependências básicas para o Sharp e outras libs nativas
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências (incluindo as de produção)
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta do Webhook
EXPOSE 3000

# Comando para iniciar o webhook (as variáveis devem ser injetadas pelo painel de deploy)
CMD ["node", "skills/cerebro-coordenacao/scripts/webhook.js"]
