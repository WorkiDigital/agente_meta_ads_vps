---
name: design-visual
description: Gera carrosséis premium para Instagram usando IA e processamento de imagem dinâmico.
---

# 🎨 Design Visual Premium

Esta habilidade é responsável por criar o conteúdo visual do ecossistema, transformando ideias estratégicas em posts de alta qualidade para o Instagram.

## 🛠️ Tecnologias
- **Gemini 2.0 Flash**: Geração de imagens de fundo realistas.
- **Sharp (NodeJS)**: Processamento e composição de imagens.
- **SVG Dinâmico**: Criação de camadas de texto nítidas.
- **Roteirização**: Padrão de 8 slides (Gancho, Contexto, Dor, Solução, Aplicação, Benefício, Erro, CTA).

## 📁 Estrutura e Localização
Os scripts desta habilidade estão organizados em:
- `skills/design-visual/scripts/gerar-post-premium.mjs` (Script principal de composição)
- `skills/design-visual/scripts/gerar-imagem.mjs` (Interface com Gemini para imagens)
- `skills/design-visual/scripts/gerar-slide.mjs` (Lógica de montagem de slides individuais)
- `skills/design-visual/scripts/carousel.mjs` (Gerenciador de múltiplos slides)

## 🚀 Como Usar
Para gerar um carrossel, a IA deve:
1. Definir o tema e o roteiro de 8 slides.
2. Gerar prompts de imagem para cada slide.
3. Executar o script de composição para mesclar fundos, overlays e textos.
4. Garantir a assinatura `@hericksonmaia` e o selo de verificado.

## 📝 Regras de Design
- **Cores**: Paleta escura e premium (#1A1A2E).
- **Tipografia**: Arial Black para títulos, Arial para corpo.
- **Composição**: Overlay de 58% de preto para garantir legibilidade do texto sobre a imagem.
