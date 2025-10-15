// captura.js
// Main script with two modes: GENERATOR and EXECUTOR
// To generate a session: Set GENERATE_SESSION=true env var
// To execute in CI: Run without the env var

const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const readline = require('readline');

pupeteer.use(StealthPlugin());

// --- Configuration ---
const OUTPUT_DIR = path.resolve(__dirname, 'data');
const SESSION_FILE = path.join(OUTPUT_DIR, 'session_completa.json');
const LINKS_FILE = path.join(OUTPUT_DIR, 'raw_links.json');

const CHAT_LIST_ITEM_SELECTOR = 'div.chat-list .ListItem.Chat';
const CHAT_NAME_SELECTOR = '.ListItem.Chat .fullName';
const MESSAGE_ITEM_SELECTOR = '.message';
const MESSAGE_LINK_SELECTOR = 'a[href]';

const IS_GENERATOR_MODE = process.env.GENERATE_SESSION === 'true';

// --- Helper Functions ---
async function ensureOutputDir() {
  try { await fs.mkdir(OUTPUT_DIR, { recursive: true }); } catch(e) {}
}

async function saveJson(file, obj) {
  await fs.writeFile(file, JSON.stringify(obj, null, 2), 'utf8');
  console.log('✅ Saved:', path.basename(file));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

// --- Session Management Functions ---

async function captureSession(page) {
    console.log('📸 Capturando sessão completa...');
    // 1. Get all cookies via CDP
    const client = await page.target().createCDPSession();
    const { cookies } = await client.send('Network.getAllCookies');
    console.log(`🍪 Cookies capturados: ${cookies.length}`);

    // 2. Get localStorage
    const localStorageData = await page.evaluate(() => {
        let data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }
        return data;
    });
    console.log(`🗄️ Itens no LocalStorage: ${Object.keys(localStorageData).length}`);

    const session = { cookies, localStorageData };
    await saveJson(SESSION_FILE, session);
    return session;
}

async function injectSession(page) {
  const sessionJson = process.env.TELEGRAM_SESSION_JSON;
  if (!sessionJson) {
    console.log('🟡 Nenhuma sessão encontrada em TELEGRAM_SESSION_JSON, prosseguindo sem injeção.');
    return;
  }
  console.log('💉 Injetando sessão a partir da variável de ambiente...');

  try {
    const session = JSON.parse(sessionJson);
    const { localStorageData, cookies } = session;

    // Injetar Cookies via CDP (the correct way)
    if (cookies && cookies.length > 0) {
      const client = await page.target().createCDPSession();
      await client.send('Network.setCookies', { cookies });
      console.log(`🍪 ${cookies.length} cookies injetados via CDP.`);
    }

    // Injetar localStorage
    if (localStorageData) {
      await page.evaluate(data => {
        // This must run before the page navigates
        for (const key in data) {
          localStorage.setItem(key, data[key]);
        }
      }, localStorageData);
      console.log('🗄️ LocalStorage preparado para injeção na navegação.');
    }
     console.log('✅ Sessão preparada para injeção.');
  } catch (error) {
    console.error('❌ Falha ao processar ou injetar a sessão JSON:', error);
  }
}


// --- Main Logic ---

async function runGeneratorMode() {
    console.log('🚀 Iniciando em Modo Gerador de Sessão...');
    await ensureOutputDir();

    const browser = await puppeteer.launch({
        headless: false, // Must be interactive
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = (await browser.pages())[0];
    await page.goto('https://web.telegram.org/a/', { waitUntil: 'networkidle2' });

    console.log('\n---\n');
    await askQuestion('❓ Por favor, faça o login no navegador. Após o login completo, volte aqui e pressione Enter...');
    console.log('---\n');

    await captureSession(page);

    console.log('✅ Sessão gerada com sucesso em "pescadores/data/session_completa.json"');
    console.log('🔒 Agora, criptografe este arquivo e configure os secrets no GitHub.');

    await browser.close();
}

async function runExecutorMode() {
    console.log('🚀 Iniciando em Modo Executor (GitHub Actions)...');
    await ensureOutputDir();

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        ],
    });

    const page = (await browser.pages())[0];
    await page.setViewport({ width: 1366, height: 900 });

    // Inject session BEFORE navigating
    await injectSession(page);

    console.log('✈️ Navegando para o Telegram Web...');
    await page.goto('https://web.telegram.org/a/', { waitUntil: 'networkidle2', timeout: 90000 });

    console.log('🔍 Aguardando a interface do Telegram carregar...');
    try {
        await page.waitForSelector(CHAT_LIST_ITEM_SELECTOR, { timeout: 60000 });
        console.log('✅ Interface do Telegram carregada (lista de chats visível).');
    } catch (e) {
        console.error('❌ A interface do Telegram não carregou a tempo.');
        await page.screenshot({ path: path.join(OUTPUT_DIR, 'debug_executor_error.png') });
        await fs.writeFile(path.join(OUTPUT_DIR, 'debug_executor_error.html'), await page.content(), 'utf8');
        throw new Error('Timeout esperando pelo seletor da lista de chats.');
    }
    
    // The rest of the scraping logic from the original script can go here.
    // For now, we just prove the login works.
    console.log('🎉 Login bem-sucedido! Capturando screenshot da página logada...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'debug_executor_success.png'), fullPage: true });
    
    // Example: Extract chat list
    const chats = await page.$$eval(CHAT_LIST_ITEM_SELECTOR, (nodes, selector) => 
        nodes.map(n => n.querySelector(selector)?.innerText.trim() || 'Unknown Chat'), 
        CHAT_NAME_SELECTOR
    );
    console.log('🗣️ Chats encontrados:', chats);
    await saveJson(path.join(OUTPUT_DIR, 'chats_encontrados.json'), chats);


    console.log('✅ Execução concluída com sucesso.');
    await browser.close();
}


// --- Entry Point ---

(async () => {
    if (IS_GENERATOR_MODE) {
        await runGeneratorMode();
    } else {
        await runExecutorMode();
    }
})().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
