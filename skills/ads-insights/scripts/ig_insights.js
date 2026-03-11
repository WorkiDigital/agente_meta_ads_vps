const axios = require('axios');
const token = process.env.META_ACCESS_TOKEN;
const igUserId = '17841401666623403'; // Herickson Maia - Tráfego Pago

async function fetchPosts() {
    if (!token) {
        console.error('❌ Erro: META_ACCESS_TOKEN não definido.');
        process.exit(1);
    }
    
    try {
        const r = await axios.get(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
            params: {
                access_token: token,
                fields: 'id,caption,media_type,media_url,permalink,like_count,comments_count,timestamp',
                limit: 100
            }
        });

        const posts = r.data.data || [];
        const sortedPosts = posts.sort((a, b) => ((b.like_count || 0) + (b.comments_count || 0)) - ((a.like_count || 0) + (a.comments_count || 0)));

        console.log(JSON.stringify(sortedPosts.slice(0, 5), null, 2));
    } catch (e) {
        console.error(e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
        process.exit(1);
    }
}

fetchPosts();
