import "dotenv/config";
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const token = process.env.META_ACCESS_TOKEN;
const igUserId = process.env.IG_USER_ID || '17841401666623403';

async function fetchAndReport() {
    if (!token) {
        console.error('❌ Erro: META_ACCESS_TOKEN não definido.');
        process.exit(1);
    }
    
    try {
        console.log("📊 Buscando dados da Meta...");
        const r = await axios.get(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
            params: {
                access_token: token,
                fields: 'id,caption,media_type,media_url,permalink,like_count,comments_count,timestamp',
                limit: 50
            }
        });

        const posts = r.data.data || [];
        
        // Relatório simplificado em Markdown
        const sortedPosts = posts.sort((a, b) => ((b.like_count || 0) + (b.comments_count || 0)) - ((a.like_count || 0) + (a.comments_count || 0)));
        const top5 = sortedPosts.slice(0, 5);

        let report = `*RELATÓRIO DE DESEMPENHO (TOP 5)*\n\n`;
        top5.forEach((p, i) => {
            const date = new Date(p.timestamp).toLocaleDateString('pt-BR');
            report += `${i+1}. *[${p.media_type}]* ${date}\n`;
            report += `❤️ ${p.like_count} | 💬 ${p.comments_count}\n`;
            report += `🔗 ${p.permalink}\n\n`;
        });

        console.log(report);
    } catch (e) {
        console.error(e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
        process.exit(1);
    }
}

fetchAndReport();
