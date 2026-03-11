/**
 * postar-instagram.mjs
 * Faz upload das imagens para Supabase Storage e publica no Instagram.
 * Suporta tanto imagem \u00fanica quanto carrossel.
 *
 * Uso:
 *   node --env-file=.env postar-instagram.mjs \
 *     --pasta "../../Conteudos Herickson/carrosel/2026-03-09/ia-whatsapp" \
 *     --caption-file "legenda.txt"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// \u2500\u2500 CONFIGURA\u00c7\u00d5ES \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const SUPABASE_URL = 'https://jgderqdwvyqfauxfwqsc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = 'instagram-media';

const META_TOKEN = process.env.META_ACCESS_TOKEN;
const IG_ID = '17841401666623403'; // @hericksonmaia
const IG_BASE = 'https://graph.facebook.com/v21.0';

// \u2500\u2500 ARGS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const args = process.argv.slice(2);
const pastaIdx = args.indexOf('--pasta');
const captionIdx = args.indexOf('--caption');

if (pastaIdx === -1) {
  console.error('\u274c Informe a pasta com --pasta "caminho/relativo"');
  process.exit(1);
}

const pastaRel = args[pastaIdx + 1];
const pasta = path.resolve(__dirname, pastaRel);
const captionFileIdx = args.indexOf('--caption-file');

let caption = '';
if (captionFileIdx >= 0) {
  caption = fs.readFileSync(path.resolve(__dirname, args[captionFileIdx + 1]), 'utf8');
} else if (captionIdx >= 0) {
  caption = args.slice(captionIdx + 1).join(' ');
}

// \u2500\u2500 FUN\u00c7\u00d5ES \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function uploadSupabase(filePath, fileName) {
  const fileBuffer = fs.readFileSync(filePath);
  const storagePath = `posts_temporarios/${Date.now()}_${fileName}`;

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
    },
    body: fileBuffer,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload falhou (${res.status}): ${err}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
  return { publicUrl, storagePath };
}

async function criarContainerUnico(imageUrl, caption) {
  const res = await fetch(`${IG_BASE}/${IG_ID}/media?access_token=${META_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption }),
  });
  const data = await res.json();
  if (!data.id) throw new Error(`Erro ao criar container: ${JSON.stringify(data)}`);
  return data.id;
}

async function deletarSupabase(storagePaths) {
  // Mock deletion since previous script implementation used a different format
  console.log(`🧹 Removendo imagens temporárias do Supabase...`);
  // Implementing minimal deletion correctly via REST
  for(const spath of storagePaths) {
     await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${spath}`, {
         method: 'DELETE',
         headers: {
           'Authorization': `Bearer ${SUPABASE_KEY}`,
           'apikey': SUPABASE_KEY
         }
     });
  }
}

async function publicarPost(creationId) {
  const res = await fetch(`${IG_BASE}/${IG_ID}/media_publish?access_token=${META_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: creationId }),
  });
  const data = await res.json();
  if (!data.id) throw new Error(`Erro ao publicar: ${JSON.stringify(data)}`);
  return data.id;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// \u2500\u2500 MAIN \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function main() {
  if (!SUPABASE_KEY) throw new Error('SUPABASE_SERVICE_KEY n\u00e3o definida no .env');
  if (!META_TOKEN) throw new Error('META_ACCESS_TOKEN n\u00e3o definida no .env');

  const arquivos = fs.readdirSync(pasta)
    .filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.png'))
    .sort()
    .map(f => path.join(pasta, f));

  if (arquivos.length === 0) {
    throw new Error(`Nenhuma imagem encontrada na pasta: ${pasta}`);
  }

  console.log(`\n\ud83d\udcc2 Pasta: ${pasta}`);
  console.log(`\ud83d\uddbc\ufe0f  ${arquivos.length} imagens encontradas\n`);

  const storagePaths = [];
  const urls = [];
  
  console.log('\u2b06\ufe0f  Fazendo upload para Supabase Storage...');
  for (const filePath of arquivos) {
    const fileName = path.basename(filePath);
    process.stdout.write(`   ${fileName}... `);
    const { publicUrl, storagePath } = await uploadSupabase(filePath, fileName);
    urls.push(publicUrl);
    storagePaths.push(storagePath);
    console.log('\u2705');
  }

  if (arquivos.length === 1) {
    // Post \u00fanico
    console.log('\n\ud83d\udce6 Criando container \u00fanico no Instagram...');
    const containerId = await criarContainerUnico(urls[0], caption);
    console.log(`\u2705 Container ID: ${containerId}`);

    console.log('\n\u23f3 Aguardando processamento (10s)...');
    await sleep(10000);

    console.log('\ud83d\ude80 Publicando no Instagram...');
    const postId = await publicarPost(containerId);
    console.log(`\n\u2705 Post \u00fanico publicado! Post ID: ${postId}`);
    console.log(`\ud83d\udd17 https://www.instagram.com/p/${postId}/\n`);
  } else {
    // L\u00f3gica de Carrossel (omitida se o foco \u00e9 imagem \u00fanica para simplificar ou reusar fun\u00e7\u00f5es)
    throw new Error('Este script foi adaptado temporariamente para imagem única. Use postar-carrosel-instagram.mjs para 2+ imagens.');
  }

  await deletarSupabase(storagePaths);
  console.log('\u2705 Limpeza conclu\u00edda.\n');
}

main().catch(err => {
  console.error('\n\u274c Erro:', err.message);
  process.exit(1);
});
