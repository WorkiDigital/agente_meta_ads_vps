# 🤖 Agente Estrategista - Ecossistema Meta Ads

Este repositório contém o ecossistema autônomo do Agente Estrategista, projetado para automação de marketing no Facebook e Instagram.

## 🏗️ Arquitetura baseada em Skills
Seguindo o padrão de design modular, as funcionalidades do sistema estão organizadas na pasta `/skills`. Cada skill é autocontida, possuindo suas próprias instruções (`SKILL.md`) e scripts de execução (`/scripts`).

### 🛠️ Lista de Habilidades (Skills)

| Skill | Descrição |
|-------|-----------|
| [🧠 Cérebro](skills/cerebro-coordenacao/SKILL.md) | Coordenação de atendimento via WhatsApp e orquestração de comandos. |
| [🎨 Design Visual](skills/design-visual/SKILL.md) | Geração de carrosséis premium com IA e Sharp. |
| [✍️ Copywriting](skills/copywriting-seo/SKILL.md) | Criação de legendas e ganchos estratégicos. |
| [🚀 Publicação Meta](skills/publicacao-meta/SKILL.md) | Fluxo de upload e publicação oficial no Instagram/Facebook. |
| [📈 Ads Insights](skills/ads-insights/SKILL.md) | Relatórios de performance e análise de métricas de anúncios. |

## 📁 Estrutura do Repositório
- `/skills`: Documentação e scripts organizados por competência.
- `/whatsapp-bot`: O bot principal que roda na VPS (Webhook e Lógica).
- `/facebook-mcp-server`: Servidor MCP para ferramentas do Facebook.
- `/instagram-mcp-server`: Servidor MCP para publicações no Instagram.
- `/evolution-mcp-server`: Servidor MCP para integração com Evolution API.
- `/designer-mcp`: Ferramentas auxiliares de design.

---
*Desenvolvido por @hericksonmaia*
