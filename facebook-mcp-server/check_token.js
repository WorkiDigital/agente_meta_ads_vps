const axios = require('axios');
require('dotenv').config({ path: 'C:\\Users\\Samsung\\.gemini\\antigravity\\scratch\\facebook-mcp-server\\.env' });

const TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

async function checkToken() {
    try {
        const url = `https://graph.facebook.com/v19.0/me/permissions`;
        const r = await axios.get(url, {
            params: {
                access_token: TOKEN
            }
        });

        console.log("Token Permissions:");
        console.log(JSON.stringify(r.data, null, 2));
    } catch (e) {
        console.error("Erro na API da Meta:");
        console.error(e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
    }
}
checkToken();
