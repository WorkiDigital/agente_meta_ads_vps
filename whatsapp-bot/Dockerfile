FROM node:18-bullseye

# Instala bibliotecas para o Sharp rodar no Linux
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia dependências primeiro para aproveitar o cache do Docker
COPY package*.json ./
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta 3000 (Webhook)
EXPOSE 3000

# Comando para rodar o Webhook focado em Gemini
CMD ["node", "webhook-gemini.js"]
