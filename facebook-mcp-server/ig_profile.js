const axios = require('axios');
require('dotenv').config({ path: 'C:\\Users\\Samsung\\.gemini\\antigravity\\scratch\\facebook-mcp-server\\.env' });

const TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const igUserId = '17841401666623403'; // Herickson Maia

async function getProfile() {
    try {
        const url = `https://graph.facebook.com/v19.0/${igUserId}`;
        const r = await axios.get(url, {
            params: {
                fields: 'username,followers_count,follows_count,media_count,profile_picture_url',
                access_token: TOKEN
            }
        });

        console.log("Dados Básicos do Perfil:");
        console.log(JSON.stringify(r.data, null, 2));
    } catch (e) {
        console.error("Erro na API da Meta:");
        console.error(e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
    }
}
getProfile();
