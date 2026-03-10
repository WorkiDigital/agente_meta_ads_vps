const axios = require('axios');
const dotenv = require('dotenv');
const FormData = require('form-data');
const fs = require('fs');

dotenv.config();

const TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const ACT_ID = 'act_3174606892664917';
const IMG_PATH = 'C:\\Users\\Samsung\\Claude Code\\Conteudos Herickson\\carrosel\\2026-03-09\\01-capa.png';

async function run() {
    try {
        console.log("Checking Pages...");
        const pagesRes = await axios.get(`${BASE_URL}/me/accounts`, {
            params: { fields: 'name,id', access_token: TOKEN }
        });
        const pages = pagesRes.data.data;
        let pageId;
        if (!pages || pages.length === 0) {
            console.log("Warning: No Facebook Pages found in the user token. The Ad Creation might fail if a Page ID is strictly required.");
        } else {
            pageId = pages[0].id;
            console.log(`Using Page: ${pages[0].name} (${pageId})`);
        }

        // 1. Upload Image
        console.log("Uploading image...");
        let imageHash = null;
        if (fs.existsSync(IMG_PATH)) {
            const form = new FormData();
            form.append('access_token', TOKEN);
            form.append('filename', fs.createReadStream(IMG_PATH));

            const uploadRes = await axios.post(`${BASE_URL}/${ACT_ID}/adimages`, form, {
                headers: form.getHeaders(),
            });
            imageHash = Object.values(uploadRes.data.images)[0].hash;
            console.log("Image uploaded! Hash:", imageHash);
        } else {
            console.error("Image not found at path:", IMG_PATH);
            return;
        }

        // 2. Create Campaign
        console.log("Creating Campaign...");
        // Use OUTCOME_AWARENESS for simpler requirements, but let's try OUTCOME_TRAFFIC as it's common.
        // Or we can use objective: 'LINK_CLICKS' which is older, but valid.
        const campPayload = {
            name: 'Campanha 01 - teste - Frio - Interesses',
            objective: 'OUTCOME_TRAFFIC',
            status: 'PAUSED',
            special_ad_categories: ['NONE'],
            is_adset_budget_sharing_enabled: false,
            access_token: TOKEN
        };
        const campRes = await axios.post(`${BASE_URL}/${ACT_ID}/campaigns`, campPayload);
        const campaignId = campRes.data.id;
        console.log("Campaign created! ID:", campaignId);

        // 3. Create AdSet
        console.log("Creating Ad Set...");
        const startTime = new Date();
        startTime.setHours(startTime.getHours() + 1); // Start in 1 hour

        const adSetPayload = {
            name: 'CJ01 - ABertp',
            campaign_id: campaignId,
            daily_budget: 2000, // 20 reais
            billing_event: 'IMPRESSIONS',
            optimization_goal: 'LINK_CLICKS',
            bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
            targeting: {
                age_min: 25,
                age_max: 54,
                genders: [1], // 1 = male
                geo_locations: {
                    countries: ['BR'] // Assuming Brazil
                },
                targeting_automation: {
                    advantage_audience: 0
                }
            },
            start_time: Math.floor(startTime.getTime() / 1000), // UNIX timestamp is required or ISO 8601 string
            status: 'PAUSED',
            access_token: TOKEN
        };
        // Optimization goal LINK_CLICKS requires promoted_object with a page_id if OUTCOME_TRAFFIC requires it, but usually not strictly needed for web traffic unless it's a specific conversion. Let's send it anyway.

        const adSetRes = await axios.post(`${BASE_URL}/${ACT_ID}/adsets`, adSetPayload);
        const adSetId = adSetRes.data.id;
        console.log("Ad Set created! ID:", adSetId);

        // 4. Create AdCreative
        // To create a creative, we need a page ID.
        if (!pageId) {
            console.error("Failed: Facebook Page ID is required to create an ad creative.");
            return;
        }

        console.log("Creating Ad Creative...");
        const creativePayload = {
            name: 'Criativo - Capa',
            object_story_spec: {
                page_id: pageId,
                link_data: {
                    image_hash: imageHash,
                    link: 'https://wa.me/', // Placeholder link
                    message: 'Confira nossa campanha!'
                }
            },
            status: 'ACTIVE',
            access_token: TOKEN
        };
        const creativeRes = await axios.post(`${BASE_URL}/${ACT_ID}/adcreatives`, creativePayload);
        const creativeId = creativeRes.data.id;
        console.log("Ad Creative created! ID:", creativeId);

        // 5. Create Ad
        console.log("Creating Ad...");
        const adPayload = {
            name: 'Anúncio 01',
            adset_id: adSetId,
            creative: { creative_id: creativeId },
            status: 'PAUSED',
            access_token: TOKEN
        };
        const adRes = await axios.post(`${BASE_URL}/${ACT_ID}/ads`, adPayload);
        console.log("Ad successfully created! ID:", adRes.data.id);

    } catch (e) {
        console.error("API Error:");
        if (e.response && e.response.data) {
            fs.writeFileSync('error.json', JSON.stringify(e.response.data, null, 2));
            console.error("Error details written to error.json");
        } else {
            console.error(e.message);
        }
    }
}

run();
