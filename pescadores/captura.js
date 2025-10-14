// captura.js
// Executar: node captura.js
// Pré-requisitos: puppeteer-extra, puppeteer-extra-plugin-stealth, puppeteer

const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const OUTPUT_DIR = path.resolve(__dirname, 'pescadores');
const LINKS_FILE = path.join(OUTPUT_DIR, 'raw_links.json');
const COOKIES_FILE = path.join(OUTPUT_DIR, 'debug_cookies_full.json');

// Ajuste os seletores abaixo conforme seu debug_page.html
const CHAT_LIST_ITEM_SELECTOR = 'div.chat-list .ListItem.Chat'; // Seletores para os itens de chat na lista
const CHAT_NAME_SELECTOR = '.ListItem.Chat .fullName';                 // Seletor para o nome do chat dentro do item de chat
// ATENÇÃO: Os seletores abaixo para mensagens precisam ser verificados visualmente
// quando um chat estiver aberto, pois o HTML fornecido não inclui a área de mensagens.
const MESSAGE_CONTAINER_SELECTOR = '.bubbles-inner'; // Contêiner das mensagens (pode ser '.messages-layout .messages-pane')
const MESSAGE_ITEM_SELECTOR = '.message';                 // Item de mensagem individual
const MESSAGE_LINK_SELECTOR = 'a[href]';                  // Links dentro de cada mensagem

async function ensureOutputDir() {
  try { await fs.mkdir(OUTPUT_DIR, { recursive: true }); } catch(e) {}
}

async function saveJson(file, obj) {
  await fs.writeFile(file, JSON.stringify(obj, null, 2), 'utf8');
  console.log('Saved:', file);
}

async function captureAllCookies(page) {
  // Usando CDP para incluir HttpOnly cookies
  const client = await page.target().createCDPSession();
  const { cookies } = await client.send('Network.getAllCookies');
  await saveJson(COOKIES_FILE, cookies);
  return cookies;
}

async function setCookiesViaCDP(page, cookies) {
  const client = await page.target().createCDPSession();
  for (const c of cookies) {
    // Network.setCookie espera campos específicos; convertendo pra garantir
    try {
      await client.send('Network.setCookie', {
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path || '/',
        secure: c.secure || false,
        httpOnly: c.httpOnly || false,
        sameSite: c.sameSite || 'Lax',
        expires: c.expirationDate || (Math.floor(Date.now()/1000) + 60*60*24*365)
      });
    } catch (err) {
      console.warn('Failed to set cookie:', c.name, err.message);
    }
  }
  console.log('Attempted to set cookies via CDP');
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function extractLinksFromChat(page) {
  // retorna array de {href, text, elementContext}
  return await page.evaluate((MESSAGE_ITEM_SELECTOR, MESSAGE_LINK_SELECTOR) => {
    const out = [];
    const messages = Array.from(document.querySelectorAll(MESSAGE_ITEM_SELECTOR));
    const urlRegex = /https?:\[\/\/\S+/g;

    for (const msg of messages) {
      // 1) links diretos <a href>
      const anchors = Array.from(msg.querySelectorAll(MESSAGE_LINK_SELECTOR));
      for (const a of anchors) {
        out.push({ href: a.href, text: a.innerText || a.href, source: 'anchor' });
      }
      // 2) links no texto
      const t = msg.innerText || '';
      const found = t.match(urlRegex);
      if (found) {
        for (const u of found) out.push({ href: u, text: t.trim().slice(0,200), source: 'text' });
      }
    }
    return out;
  }, MESSAGE_ITEM_SELECTOR, MESSAGE_LINK_SELECTOR);
}

async function scrollChatToTop(page) {
  // rolagem incremental para carregar mensagens antigas
  await page.evaluate(async () => {
    const scroller = document.querySelector('.messages'); // ajuste se necessário
    if (!scroller) return;
    let previousScroll = -1;
    for (let i=0; i<10; i++) { // limita tentativas
      scroller.scrollTop = 0; // ir pro topo
      await new Promise(r => setTimeout(r, 800 + Math.random()*500));
      if (scroller.scrollTop === previousScroll) break;
      previousScroll = scroller.scrollTop;
    }
  });
}

async function main() {
  await ensureOutputDir();

  const browser = await puppeteer.launch({
    headless: true, // Rodar em modo headless para GitHub Actions
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
    // userDataDir: 'path/to/user/data' // opcional: persistir perfil Chromium
  });
  const page = (await browser.pages())[0];

  // Navega diretamente para a URL do Telegram Web
  await page.goto('https://web.telegram.org/a/', { waitUntil: 'networkidle2', timeout: 120000 });

  // 1) Captura cookies completos via CDP (HttpOnly incluído)
  try {
    await captureAllCookies(page);
  } catch (err) {
    console.warn('Erro ao capturar cookies via CDP:', err.message);
  }

  // 2) Extrair lista de chats
  const chats = await page.$$eval(CHAT_LIST_ITEM_SELECTOR, (nodes, CHAT_NAME_SELECTOR) => {
    return nodes.map(n => {
      const nameNode = n.querySelector(CHAT_NAME_SELECTOR);
      return {
        title: nameNode ? nameNode.innerText.trim() : n.innerText.trim().slice(0,40),
        // Podemos extrair um identificador se houver data-attr
        id: n.getAttribute('data-peer') || n.getAttribute('data-chat-id') || null,
      };
    });
  }, CHAT_NAME_SELECTOR);

  console.log('Chats encontrados:', chats.length);

  const results = [];
  const chatElements = await page.$$(CHAT_LIST_ITEM_SELECTOR);

  for (let i=0; i<chatElements.length; i++) {
    try {
      const el = chatElements[i];
      const chatInfo = chats[i] || { title: `chat-${i}`, id: null };
      console.log(`Abrindo chat ${i+1}/${chatElements.length}:`, chatInfo.title);

      // Clicar no chat para abrir
      await el.click();
      await sleep(800 + Math.random()*700);

      // rolar para carregar histórico (se necessário)
      await scrollChatToTop(page);
      await sleep(500 + Math.random()*500);

      // Extrair links
      const links = await extractLinksFromChat(page);
      console.log(`Links extraídos no chat "${chatInfo.title}":`, links.length);

      // adicionar metadados
      for (const L of links) {
        results.push({
          chatTitle: chatInfo.title,
          chatId: chatInfo.id,
          href: L.href,
          text: L.text,
          source: L.source,
          timestamp: new Date().toISOString()
        });
      }

      // pequena pausa "humana"
      await sleep(400 + Math.random()*1000);

    } catch (err) {
      console.error('Erro ao processar chat index', i, err.message);
    }
  }

  // Filtrar duplicados (por href)
  const unique = [];
  const seen = new Set();
  for (const r of results) {
    if (!r.href) continue;
    if (seen.has(r.href)) continue;
    seen.add(r.href);
    unique.push(r);
  }

  await saveJson(LINKS_FILE, { generatedAt: new Date().toISOString(), links: unique });
  console.log('Extração finalizada. Total único:', unique.length);

  // Opcional: capturar cookies novamente após navegação
  try {
    await captureAllCookies(page);
  } catch(e) {}

  // await browser.close(); // opcional: mantenha aberto para inspeção
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});