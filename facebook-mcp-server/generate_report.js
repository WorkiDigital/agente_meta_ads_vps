const fs = require('fs');

function processReport() {
    const data = JSON.parse(fs.readFileSync('90days_report.json', 'utf8'));

    // Calcular engajamento total (curtidas + comentários + salvamentos se tiver) e extrair reach e plays
    const processed = data.map(post => {
        let reach = 0;
        let plays = 0;
        let saved = 0;

        if (post.insights && Array.isArray(post.insights)) {
            post.insights.forEach(metric => {
                if (metric.name === 'reach') reach = metric.values[0].value;
                if (metric.name === 'plays') plays = metric.values[0].value;
                if (metric.name === 'saved') saved = metric.values[0].value;
            });
        }

        const likes = post.like_count || 0;
        const comments = post.comments_count || 0;
        const totalEngagement = likes + comments + saved;

        return {
            id: post.id,
            type: post.media_type,
            permalink: post.permalink,
            date: new Date(post.timestamp).toLocaleDateString('pt-BR'),
            likes,
            comments,
            saved,
            totalEngagement,
            reach,
            plays,
            caption: post.caption ? post.caption.substring(0, 50).replace(/\n/g, ' ') + '...' : 'Sem legenda'
        };
    });

    // Top Engajamento
    const topEngagement = [...processed].sort((a, b) => b.totalEngagement - a.totalEngagement).slice(0, 5);

    // Top Alcance
    const topReach = [...processed].sort((a, b) => b.reach - a.reach).slice(0, 5);

    // Top Curtidas
    const topLikes = [...processed].sort((a, b) => b.likes - a.likes).slice(0, 5);

    let reportMD = `# Relatório de Desempenho - Últimos 90 Dias (@hericksonmaia)\n\n`;
    reportMD += `Período analisado: Últimos 90 dias. Total de posts extraídos: ${processed.length}.\n\n`;

    reportMD += `## 🔥 Top 5 Posts por Maior Engajamento (Curtidas + Comentários + Salvamentos)\n`;
    topEngagement.forEach((p, i) => {
        reportMD += `${i + 1}. **[${p.type}]** ${p.date} - Engajamento: **${p.totalEngagement}** (Alcance: ${p.reach})\n`;
        reportMD += `   - 🔗 [Acessar Post](${p.permalink})\n`;
        reportMD += `   - 📝 "${p.caption}"\n`;
    });

    reportMD += `\n## 👁️ Top 5 Posts por Maior Alcance (Reach)\n`;
    topReach.forEach((p, i) => {
        reportMD += `${i + 1}. **[${p.type}]** ${p.date} - Alcance: **${p.reach}** (Engajamento: ${p.totalEngagement})\n`;
        reportMD += `   - 🔗 [Acessar Post](${p.permalink})\n`;
        reportMD += `   - 📝 "${p.caption}"\n`;
    });

    reportMD += `\n## ❤️ Top 5 Posts por Mais Curtidas\n`;
    topLikes.forEach((p, i) => {
        reportMD += `${i + 1}. **[${p.type}]** ${p.date} - Curtidas: **${p.likes}**\n`;
        reportMD += `   - 🔗 [Acessar Post](${p.permalink})\n`;
        reportMD += `   - 📝 "${p.caption}"\n`;
    });

    reportMD += `\n*Nota sobre seguidores: A API da Meta (Graph API) não fornece diretamente métricas individuais de 'novos seguidores gerados por cada post' (Followers by Post) para contas padrão. Apenas alcance, compartilhamentos salvamentos e interações.*`;

    fs.writeFileSync('C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\1e235fc9-ab17-4ae9-a248-01185c1f8c47\\relatorio_90dias.md', reportMD);
    console.log("Relatório gerado em Markdown.");
}

processReport();
