---
name: publicacao-meta
description: Gerencia a publicação automática de conteúdos no Instagram e Facebook via Meta API e Supabase.
---

# 🚀 Publicação Meta Ads

Esta habilidade cuida de todo o fluxo de upload e publicação oficial das mídias geradas, garantindo que o conteúdo chegue ao público final de forma automatizada.

## 🛠️ Tecnologias
- **Meta Graph API**: Interface oficial para publicação no Instagram/Facebook.
- **Supabase Storage**: Hospedagem temporária das imagens para geração de URLs públicas.
- **Node.js**: Orquestração do handshake com as APIs.

## 📁 Scripts Principais
- `skills/publicacao-meta/scripts/postar-carrosel-instagram.mjs`
- `skills/publicacao-meta/scripts/postar-unico-instagram.mjs`

## 🔄 Fluxo de Trabalho
1. **Hospedagem**: Sobe a arte para o bucket `instagram-media` no Supabase.
2. **Container**: Cria o media container na Meta com a URL do Supabase e a legenda gerada.
3. **Verificação**: Aguarda o processamento da Meta (~10-20 segundos).
4. **Publicação**: Publica o container no feed.
5. **Limpeza**: Deleta o arquivo do Supabase após a confirmação do post.

## ⚠️ Requisitos
- Token de acesso da Meta válido com permissões de publicação.
- Credenciais do Supabase configuradas no `.env`.
