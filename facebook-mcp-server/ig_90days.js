const axios = require('axios');
const fs = require('fs');
require('dotenv').config({ path: 'C:\\Users\\Samsung\\.gemini\\antigravity\\scratch\\facebook-mcp-server\\.env' });

const TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const igUserId = '17841401666623403'; // Herickson Maia

async function getRecentPosts() {
    try {
        console.log("Fetching media...");
        let allMedia = [];
        let url = `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,caption,media_type,media_url,permalink,like_count,comments_count,timestamp&access_token=${TOKEN}&limit=50`;

        // Calcular timestamp de 90 dias atrás
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Paginação para buscar as mídias até os últimos 90 dias
        let keepFetching = true;
        while (url && keepFetching) {
            const r = await axios.get(url);
            const data = r.data.data;

            for (let post of data) {
                const postDate = new Date(post.timestamp);
                if (postDate >= ninetyDaysAgo) {
                    allMedia.push(post);
                } else {
                    // Como os posts vêm em ordem descrescente, se eu achei um mais antigo q 90 dias, eu posso parar
                    keepFetching = false;
                    break;
                }
            }
            url = r.data.paging && r.data.paging.next ? r.data.paging.next : null;
        }

        console.log(`Buscando insights detalhados para os ${allMedia.length} posts mais recentes (até 90 dias)...`);

        // Extrair insights de Alcance de cada postagem selecionada.
        for (let i = 0; i < allMedia.length; i++) {
            // Limite de taxa de API pode pegar. Não fazer tudo de uma vez sem um delay
            let post = allMedia[i];
            try {
                // Nem todo post suporta reach (Album, etc costuma ter outros. Mas 'reach' ou 'impressions' e 'saved' para imagem|reels)
                let metric = 'reach,saved';
                if (post.media_type === 'CAROUSEL_ALBUM') metric = 'reach,saved';
                else if (post.media_type === 'VIDEO') metric = 'reach,saved,plays'; // VIDEO geralmente suporta 'plays'

                const insightRes = await axios.get(`https://graph.facebook.com/v19.0/${post.id}/insights`, {
                    params: {
                        metric: metric,
                        access_token: TOKEN
                    }
                });

                post.insights = insightRes.data.data;
            } catch (err) {
                post.insights_error = err.message;
            }
        }

        fs.writeFileSync('90days_report.json', JSON.stringify(allMedia, null, 2));
        console.log("Relatório salvo em 90days_report.json");
    } catch (e) {
        console.error("Erro geral:");
        console.error(e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
    }
}
getRecentPosts();
