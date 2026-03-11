const fs = require('fs');
const path = require('path');

function processReport() {
    const dataFile = path.resolve(process.cwd(), '90days_report.json');
    if (!fs.existsSync(dataFile)) {
        console.error(`❌ Erro: ${dataFile} não encontrado.`);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

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

    const topEngagement = [...processed].sort((a, b) => b.totalEngagement - a.totalEngagement).slice(0, 5);
    const topReach = [...processed].sort((a, b) => b.reach - a.reach).slice(0, 5);
    const topLikes = [...processed].sort((a, b) => b.likes - a.likes).slice(0, 5);

    let reportMD = `# Relatório de Desempenho - Últimos 90 Dias (@hericksonmaia)\n\n`;
    reportMD += `Período analisado: Últimos 90 dias. Total de posts extraídos: ${processed.length}.\n\n`;

    reportMD += `## 🔥 Top 5 Posts por Maior Engajamento\n`;
    topEngagement.forEach((p, i) => {
        reportMD += `${i + 1}. **[${p.type}]** ${p.date} - Engajamento: **${p.totalEngagement}**\n`;
        reportMD += `   - 🔗 [Acessar Post](${p.permalink})\n`;
        reportMD += `   - 📝 "${p.caption}"\n`;
    });

    reportMD += `\n## 👁️ Top 5 Posts por Maior Alcance (Reach)\n`;
    topReach.forEach((p, i) => {
        reportMD += `${i + 1}. **[${p.type}]** ${p.date} - Alcance: **${p.reach}**\n`;
        reportMD += `   - 🔗 [Acessar Post](${p.permalink})\n`;
    });

    const outPath = path.resolve(process.cwd(), 'relatorio_90dias.md');
    fs.writeFileSync(outPath, reportMD);
    console.log(`✅ Relatório gerado em: ${outPath}`);
}

processReport();
