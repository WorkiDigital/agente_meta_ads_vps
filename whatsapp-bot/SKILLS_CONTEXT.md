# 🛠️ As Skills do Agente Estrategista — @hericksonmaia

Este documento detalha o funcionamento técnico de cada "Habilidade" (Skill) do ecossistema autônomo, servindo como base de conhecimento para futuras expansões e manutenções.

---

## 1. 🧠 Coordenação e Atendimento (Cérebro)
**Tecnologias:** `webhook.js` | Evolution API | Claude Code CLI

*   **Escuta Ativa:** O servidor `webhook.js` atua como o ouvido do sistema, recebendo eventos `MESSAGES_UPSERT` da Evolution API (WhatsApp).
*   **Gatekeeper de Segurança:** Valida números autorizados e gerencia sessões via `wrkcode`.
*   **Processamento de Linguagem:** Utiliza o `child_process.spawn` para invocar o Claude Code diretamente no terminal da máquina local. Ele passa a mensagem do usuário e o contexto do projeto, permitindo que a IA decida quais scripts executar.
*   **Feedback em Tempo Real:** Simula "digitando" no WhatsApp enquanto o Claude processa a lógica de marketing.

---

## 2. 🎨 Design Visual Premium (Músculos de Arte)
**Tecnologias:** `DesignerService.js` | `gerar-post-premium.mjs` | Gemini 2.0 Flash | Sharp (NodeJS)

*   **Roteirização ESTRATÉGICA:** O agente segue o padrão de 8 slides (Gancho -> Contexto -> Dor -> Solução -> Aplicação -> Benefício -> Erro Comum -> CTA).
*   **Geração de Fundo (Imaginação):** O Gemini 2.0 Flash gera imagens fotorrealistas e cinemáticas com base em prompts dinâmicos criados pela IA.
*   **Arte Final (Matemática do Design):**
    *   Usa **SVG dinâmico** para garantir textos nítidos e alinhamentos perfeitos.
    *   Aplica **Fontes Identitárias:** Arial Black (Títulos) e Arial (Corpo).
    *   **Composição Sharp:** Mescla o fundo do Gemini, um overlay de legibilidade (preto 58%) e as camadas de texto/assinatura.
    *   **Assinatura Automática:** Inclui o handle `@hericksonmaia`, selo de verificado e profissão no rodapé escuro (#1A1A2E).

---

## 3. ✍️ Copywriting & SEO (A Voz)
**Tecnologias:** `CopyService.js` | IA Text Model

*   **Extração de Contexto:** Lê os textos gerados para os slides para manter a coerência entre imagem e legenda.
*   **Engenharia de Prompt:** Gera legendas com ganchos magnéticos, desenvolvimento estratégico e CTAs claras para o nicho de Tráfego Pago.
*   **Otimização:** Inclui conjuntos de hashtags de performance e formatação amigável para a leitura no Instagram (espaçamentos e emojis estratégicos).

---

## 4. 🚀 Publicação Meta Ads (A Entrega)
**Tecnologias:** `postar-unico-instagram.mjs` | Meta Graph API | Supabase Storage

*   **Hospedagem Efêmera:** Sobe as artes geradas para o bucket `instagram-media` no Supabase via REST API. Isso gera a URL pública necessária para a Meta.
*   **Handshake Meta:**
    *   1. Cria o Container de Mídia (Image URL + Caption).
    *   2. Aguarda o processamento dos servidores da Meta (~10s).
    *   3. Publica oficialmente o container no Feed.
*   **Auto-Cleaning:** Após a publicação confirmada, o script deleta os arquivos do Supabase para manter o Storage limpo e gratuito.

---

## 📈 Fluxo de Trabalho Integrado
Quando você diz no zap: *"Cria um post sobre escala de ROAS"*:
1. **Webhook** ouve -> **Claude** pensa a estratégia -> **Claude** gera o `config.json` -> **Claude** roda o `gerar-post-premium.mjs` -> **Designer** gera artes -> **Copy** gera legenda -> **Claude** (ou você) roda o `postar-unico-instagram.mjs` -> **POST ESTÁ NO AR!** 🚀
