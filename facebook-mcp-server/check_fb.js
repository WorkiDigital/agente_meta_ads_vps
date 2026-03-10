import axios from 'axios';
import dotenv from 'dotenv';
import FormData from 'form-data';
import fs from 'fs';

dotenv.config();

const TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

async function run() {
    try {
        console.log("Checking Ad Accounts...");
        const adAccountsRes = await axios.get(`${BASE_URL}/me/adaccounts`, {
            params: { fields: 'name,id', access_token: TOKEN }
        });
        const adAccounts = adAccountsRes.data.data;
        console.log("Ad Accounts:", adAccounts);

        const targetAccount = adAccounts.find(acc => acc.name && acc.name.toLowerCase().includes('rodrigo mendanha'));
        if (!targetAccount) {
            console.log("Could not find Ad Account for Rodrigo Mendanha");
            // return;
        } else {
            console.log(`Found Ad Account: ${targetAccount.name} (${targetAccount.id})`);
        }

        const actId = targetAccount ? targetAccount.id : adAccounts[0]?.id;

        if (!actId) {
            console.log("No ad accounts available.");
            return;
        }

        console.log(`Using Ad Account: ${actId}`);

        console.log("Checking Pages...");
        const pagesRes = await axios.get(`${BASE_URL}/me/accounts`, {
            params: { fields: 'name,id', access_token: TOKEN }
        });
        console.log("Pages:", pagesRes.data.data);

        // Upload the image
        const imgPath = 'C:\\Users\\Samsung\\Claude Code\\Conteudos Herickson\\carrosel\\2026-03-09\\01-capa.png';
        if (fs.existsSync(imgPath)) {
            console.log("Uploading image...");
            const form = new FormData();
            form.append('access_token', TOKEN);
            form.append('filename', fs.createReadStream(imgPath));

            const uploadRes = await axios.post(`${BASE_URL}/${actId}/adimages`, form, {
                headers: form.getHeaders(),
            });
            console.log("Image uploaded successfully:", uploadRes.data);

            // Note: uploadRes.data.images contains the hash
            const hash = Object.values(uploadRes.data.images)[0].hash;
            console.log("Image Hash:", hash);

            // To create an ad, we need Campaign, AdSet, and Ad. Let's just output the IDs so we can ask the user what to do or do it in the next step.
        } else {
            console.log("Image not found at path:", imgPath);
        }

    } catch (e) {
        console.error("API Error:", e.response ? e.response.data : e.message);
    }
}

run();
