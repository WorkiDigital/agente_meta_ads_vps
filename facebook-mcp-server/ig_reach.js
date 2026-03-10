const axios = require('axios');
require('dotenv').config({ path: 'C:\\Users\\Samsung\\.gemini\\antigravity\\scratch\\facebook-mcp-server\\.env' });

const TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const igUserId = '17841401666623403'; // Herickson Maia

async function getInsights() {
    try {
        const url = `https://graph.facebook.com/v19.0/${igUserId}/insights`;
        const r = await axios.get(url, {
            params: {
                metric: 'reach',
                period: 'day',
                access_token: TOKEN
            }
        });

        const fs = require('fs');
        fs.writeFileSync('reach.json', JSON.stringify(r.data, null, 2));
        console.log("Alcance salvo no reach.json");
    } catch (e) {
        console.error("Erro na API da Meta:");
        console.error(e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
    }
}
getInsights();
