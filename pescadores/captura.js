const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const cookiesPath = path.join(dataDir, 'debug_cookies.json');
const localStoragePath = path.join(dataDir, 'debug_localStorage.json');
const sessionStoragePath = path.join(dataDir, 'debug_sessionStorage.json');
const networkLogPath = path.join(dataDir, 'network_log.json');

async function run() {
    console.log('Navegando para o Telegram Web...');

    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: './user_data',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Habilitar interceptação de requisições
    await page.setRequestInterception(true);

    const networkLog = [];

    // Capturar requisições
    page.on('request', request => {
        // Continuar todas as requisições para não bloquear a navegação
        request.continue();
    });

    // Capturar respostas
    page.on('response', async response => {
        const url = response.url();
        const request = response.request();
        const resourceType = request.resourceType();
        const method = request.method();
        const headers = request.headers();
        const postData = request.postData();
        const status = response.status();

        // Filtrar por URLs da API do Telegram e tipos de mídia
        const isTelegramApi = url.includes('web.telegram.org') && (url.includes('/apiid/') || url.includes('/api/'));
        const isMedia = url.match(/\.(mp4|m3u8|ts|webm|ogg|mov|avi|flv|wmv)(\?.*)?$/i);

        if (isTelegramApi || isMedia) {
            let responseBody = null;
            try {
                if (response.ok()) {
                    const contentType = response.headers()['content-type'] || '';
                    if (contentType.includes('application/json')) {
                        responseBody = await response.json();
                    } else if (contentType.includes('text/')) {
                        responseBody = await response.text();
                    } else {
                        // Para outros tipos, apenas registrar que o corpo não foi lido
                        responseBody = `(Corpo não lido para Content-Type: ${contentType})`;
                    }
                } else {
                    responseBody = `(Erro na resposta: ${status})`;
                }
            } catch (error) {
                responseBody = `(Erro ao ler corpo da resposta: ${error.message})`;
            }

            networkLog.push({
                url,
                resourceType,
                method,
                headers,
                postData,
                responseStatus: status,
                responseBody
            });
        }
    });

    await page.goto('https://web.telegram.org/k/', { waitUntil: 'networkidle2' });

    console.log('Aguardando interação do usuário para login e navegação...');
    console.log('Por favor, faça login no Telegram Web e navegue pelos canais e vídeos.');
    console.log('O navegador permanecerá aberto por 15 minutos para sua interação.');
    console.log('Após sua interação, o script tentará salvar os dados da sessão e da rede.');

    await new Promise(resolve => setTimeout(resolve, 900000)); // 15 minutos

    console.log('Tempo de interação encerrado. Salvando dados da sessão e da rede...');

    // Capturar cookies
    try {
        const cookies = await page.cookies();
        await fs.writeFile(cookiesPath, JSON.stringify(cookies, null, 2));
        console.log('Cookies salvos em debug_cookies.json');
    } catch (error) {
        console.error(`Erro ao salvar cookies: ${error.message}`);
    }

    // Capturar localStorage
    try {
        const localStorageData = await page.evaluate(() => {
            let json = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                json[key] = localStorage.getItem(key);
            }
            return json;
        });
        await fs.writeFile(localStoragePath, JSON.stringify(localStorageData, null, 2));
        console.log('Local Storage salvo em debug_localStorage.json');
    } catch (error) {
        console.error(`Erro ao salvar Local Storage: ${error.message}`);
    }

    // Capturar sessionStorage
    try {
        const sessionStorageData = await page.evaluate(() => {
            let json = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                json[key] = sessionStorage.getItem(key);
            }
            return json;
        });
        await fs.writeFile(sessionStoragePath, JSON.stringify(sessionStorageData, null, 2));
        console.log('Session Storage salvo em debug_sessionStorage.json');
    } catch (error) {
        console.error(`Erro ao salvar Session Storage: ${error.message}`);
    }

    // Salvar log de rede
    try {
        await fs.writeFile(networkLogPath, JSON.stringify(networkLog, null, 2));
        console.log('Log de rede salvo em network_log.json');
    } catch (error) {
        console.error(`Erro ao salvar log de rede: ${error.message}`);
    }

    await browser.close();
    console.log('Navegador fechado. Captura concluída.');
}

run().catch(console.error);