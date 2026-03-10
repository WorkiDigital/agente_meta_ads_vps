const axios = require('axios');
require('dotenv').config({ path: 'C:\\Users\\Samsung\\.gemini\\antigravity\\scratch\\facebook-mcp-server\\.env' });

const TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const ACT_ID = 'act_3174606892664917';

async function run() {
    try {
        const adAccountRes = await axios.get(`${BASE_URL}/${ACT_ID}`, {
            params: { fields: 'name,id', access_token: TOKEN }
        });
        console.log("Account Name:", adAccountRes.data.name);
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
run();
