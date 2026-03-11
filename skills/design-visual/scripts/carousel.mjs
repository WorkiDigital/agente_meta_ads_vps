import sharp from "sharp";
import axios from "axios";
import { readFileSync, mkdirSync } from "fs";

const api = axios.create({
  baseURL: process.env.EVOLUTION_URL,
  headers: { apikey: process.env.EVOLUTION_API_KEY },
});

const NUMERO = "558598372658";
const INSTANCE = process.env.EVOLUTION_INSTANCE;

// Slides: { foto, titulo, subtitulo, rodape }
const slides = [
  {
    foto: "fotos/foto-1773008491-0.jpg",
    tag: "",
    titulo: "A IA que disse NÃO\npara as armas",
    subtitulo: "",
    rodape: "@hericksonmaia",
  },
  {
    foto: "fotos/foto-1773008490-3.jpg",
    tag: "O QUE ACONTECEU",
    titulo: "A Anthropic proibiu\no uso do Claude",
    subtitulo: "A empresa criadora do Claude publicou\numa política clara: sua IA não pode\nser usada para desenvolver armas,\nmísseis ou sistemas militares ofensivos.",
    rodape: "@hericksonmaia",
  },
  {
    foto: "fotos/foto-1773008491-1.jpg",
    tag: "O QUE É BLOQUEADO",
    titulo: "Claude recusa\nqualquer pedido de:",
    subtitulo: "❌ Desenvolvimento de armas\n❌ Sistemas de ataque autônomo\n❌ Bioweapons e armas químicas\n❌ Uso militar ofensivo",
    rodape: "@hericksonmaia",
  },
  {
    foto: "fotos/foto-1773008491-2.jpg",
    tag: "POR QUE IMPORTA",
    titulo: "IA com\nlimites éticos",
    subtitulo: "Pela primeira vez, uma big tech\ncolocou ética acima de contrato.\nIsso muda o jogo para toda\na indústria de tecnologia.",
    rodape: "@hericksonmaia",
  },
  {
    foto: "fotos/foto-1773008385-7.jpg",
    tag: "O OUTRO LADO",
    titulo: "Mas nem tudo\né tão simples...",
    subtitulo: "Concorrentes como GPT-4 e Gemini\nainda negociam contratos militares.\nA pressão sobre a Anthropic\npode crescer com o tempo.",
    rodape: "@hericksonmaia",
  },
  {
    foto: "fotos/foto-1773008385-6.jpg",
    tag: "MINHA VISÃO",
    titulo: "Tecnologia precisa\nter consciência",
    subtitulo: "A IA mais poderosa do mundo\nrecusando ordens é um sinal\nde que o futuro pode ser\nconstruído com responsabilidade.",
    rodape: "Salva esse post 🔖 | @hericksonmaia",
  },
];

mkdirSync("carousel-output", { recursive: true });

function quebrarLinhas(texto, maxLen = 32) {
  if (!texto) return [];
  return texto.split("\n").flatMap(linha => {
    if (linha.length <= maxLen) return [linha];
    const palavras = linha.split(" ");
    const linhas = [];
    let atual = "";
    for (const p of palavras) {
      if ((atual + " " + p).trim().length > maxLen) {
        if (atual) linhas.push(atual.trim());
        atual = p;
      } else {
        atual = (atual + " " + p).trim();
      }
    }
    if (atual) linhas.push(atual.trim());
    return linhas;
  });
}

async function criarSlide(slide, index) {
  const imgBuffer = readFileSync(slide.foto);
  const meta = await sharp(imgBuffer).metadata();
  const W = meta.width;
  const H = meta.height;

  // Linhas de texto
  const linhasTitulo = quebrarLinhas(slide.titulo, 22);
  const linhasSubtitulo = quebrarLinhas(slide.subtitulo, 38);

  const tamTitulo = 64;
  const tamSubtitulo = 32;
  const tamTag = 26;
  const tamRodape = 28;
  const lineHeightTitulo = 78;
  const lineHeightSub = 42;

  // Calcular bloco central de texto
  const totalLinhasTitulo = linhasTitulo.length;
  const totalLinhasSub = linhasSubtitulo.length;
  const alturaTag = slide.tag ? 50 : 0;
  const espacoTagTitulo = slide.tag ? 20 : 0;
  const espacoTituloSub = totalLinhasSub > 0 ? 30 : 0;
  const alturaTitulo = totalLinhasTitulo * lineHeightTitulo;
  const alturaSub = totalLinhasSub * lineHeightSub;
  const alturaTotal = alturaTag + espacoTagTitulo + alturaTitulo + espacoTituloSub + alturaSub;

  const centroY = H * 0.52;
  let y = centroY - alturaTotal / 2;

  let svgContent = `
    <defs>
      <filter id="shadow">
        <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="rgba(0,0,0,0.9)"/>
      </filter>
      <filter id="shadowSoft">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.7)"/>
      </filter>
    </defs>
    <!-- Gradiente topo -->
    <rect x="0" y="0" width="${W}" height="220" fill="url(#gradTopo)" opacity="0.85"/>
    <!-- Gradiente rodapé -->
    <rect x="0" y="${H - 120}" width="${W}" height="120" fill="url(#gradRodape)" opacity="0.85"/>
    <!-- Gradiente central suave -->
    <rect x="0" y="${H * 0.3}" width="${W}" height="${H * 0.45}" fill="rgba(0,0,0,0.35)" rx="0"/>
  `;

  // TAG
  if (slide.tag) {
    svgContent += `
      <rect x="${W / 2 - 160}" y="${y}" width="320" height="38" rx="4" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
      <text x="${W / 2}" y="${y + 27}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${tamTag}" font-weight="700" fill="white" letter-spacing="3" filter="url(#shadowSoft)">${slide.tag}</text>
    `;
    y += alturaTag + espacoTagTitulo;
  }

  // TITULO
  for (const linha of linhasTitulo) {
    svgContent += `<text x="${W / 2}" y="${y + tamTitulo}" text-anchor="middle" font-family="Georgia, serif" font-size="${tamTitulo}" font-weight="bold" fill="white" filter="url(#shadow)">${linha}</text>`;
    y += lineHeightTitulo;
  }

  y += espacoTituloSub;

  // SUBTITULO
  for (const linha of linhasSubtitulo) {
    svgContent += `<text x="${W / 2}" y="${y + tamSubtitulo}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${tamSubtitulo}" fill="rgba(255,255,255,0.92)" filter="url(#shadowSoft)">${linha}</text>`;
    y += lineHeightSub;
  }

  // RODAPÉ
  svgContent += `<text x="${W / 2}" y="${H - 38}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${tamRodape}" font-weight="bold" fill="rgba(255,255,255,0.85)" filter="url(#shadowSoft)">${slide.rodape}</text>`;

  // Número do slide
  svgContent += `<text x="${W - 30}" y="50" text-anchor="end" font-family="Arial, sans-serif" font-size="26" fill="rgba(255,255,255,0.5)">${index + 1}/${slides.length}</text>`;

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradTopo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(0,0,0,0.8)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </linearGradient>
      <linearGradient id="gradRodape" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.8)"/>
      </linearGradient>
    </defs>
    ${svgContent}
  </svg>`;

  const finalBuffer = await sharp(imgBuffer)
    .composite([{ input: Buffer.from(svg), blend: "over" }])
    .jpeg({ quality: 92 })
    .toBuffer();

  const arquivo = `carousel-output/slide-${index + 1}.jpg`;
  import { writeFileSync } from "fs";
  writeFileSync(arquivo, finalBuffer);

  return { arquivo, buffer: finalBuffer };
}

console.log("🎨 Gerando carousel...\n");

const arquivos = [];
for (let i = 0; i < slides.length; i++) {
  const { arquivo, buffer } = await criarSlide(slides[i], i);
  arquivos.push({ arquivo, buffer });
  console.log(`✅ Slide ${i + 1}/${slides.length}: ${arquivo}`);
}

console.log("\n📲 Enviando para o WhatsApp...\n");

for (let i = 0; i < arquivos.length; i++) {
  const base64 = arquivos[i].buffer.toString("base64");
  await api.post(`/message/sendMedia/${INSTANCE}`, {
    number: NUMERO,
    mediatype: "image",
    mimetype: "image/jpeg",
    caption: i === 0 ? "🎠 Carousel: A IA que disse NÃO para as armas" : `Slide ${i + 1}`,
    media: base64,
  });
  console.log(`📤 Slide ${i + 1} enviado`);
  await new Promise(r => setTimeout(r, 1000));
}

console.log("\n✅ Carousel completo enviado!");
