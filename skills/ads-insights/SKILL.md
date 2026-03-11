---
name: ads-insights
description: Análise de performance e geração de relatórios para contas de anúncios no Facebook e Instagram.
---

# 📈 Relatórios e Insights de Ads

Esta habilidade fornece inteligência de dados ao sistema, permitindo que o Agente Estrategista tome decisões baseadas em performance real das campanhas.

## 🛠️ Tecnologias
- **Meta Graph API**: Coleta de métricas (Spend, CPC, Reach, CTR, etc).
- **Node.js**: Scripts de processamento de dados e geração de JSON/Reports.

## 📁 Ferramentas (Scripts)
Localizado em `skills/ads-insights/scripts/`:
- `generate_report.js`: Cria relatórios detalhados de performance.
- `ig_insights.js`: Métricas específicas do Instagram.

## 📊 Métricas Monitoradas
- **CTR (Click-Through Rate)**: Eficácia do criativo.
- **CPM (Cost Per Mille)**: Custo de atenção no leilão.
- **CPC (Cost Per Click)**: Eficiência de tráfego.
- **Total Spend**: Controle de orçamento.

## 🚀 Como Usar
O agente pode invocar estes scripts para:
1. Auditar o CTR de uma conta e sugerir novos posts se estiver baixo.
2. Gerar relatórios de 30, 60 ou 90 dias para o usuário via WhatsApp.
3. Verificar a saúde do token de acesso da Meta.
