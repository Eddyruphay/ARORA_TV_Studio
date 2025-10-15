const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const sessionPath = path.join(dataDir, 'telegram_session.json');

async function run() {
    console.log('Iniciando o processo de extração de sessão do Telegram Web...');

    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: './user_data', // Reutiliza a sessão do navegador para evitar logins repetidos
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    console.log('Navegando para o Telegram Web...');
    await page.goto('https://web.telegram.org/k/', { waitUntil: 'networkidle2' });

    console.log('Aguardando o login e a inicialização completa da aplicação...');

    try {
        // Espera por um seletor que só existe quando o usuário está logado e a app carregada
        await page.waitForSelector('.ChatList', { timeout: 300000 }); // 5 minutos de timeout
        console.log('Usuário logado e aplicação pronta.');
    } catch (error) {
        console.error('Erro: O login não foi detectado no tempo esperado. O seletor .ChatList não foi encontrado.');
        console.log('Por favor, faça o login manualmente no navegador e reinicie o script.');
        await browser.close();
        return;
    }

    console.log('Extraindo dados da sessão...');

    try {
        const sessionData = await page.evaluate(() => {
            // 1. Extrair todo o localStorage
            const localStorageData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                localStorageData[key] = localStorage.getItem(key);
            }

            // 2. Tentar encontrar api_id e api_hash no ambiente da janela (window)
            // Esta parte é exploratória e pode precisar de ajuste.
            // Vamos procurar em objetos globais comuns onde eles podem estar.
            let apiConfig = {};
            if (window.Telegram) {
                // Exemplo hipotético de onde poderiam estar
                if (window.Telegram.Api && window.Telegram.Api.config) {
                    apiConfig.api_id = window.Telegram.Api.config.api_id;
                    apiConfig.api_hash = window.Telegram.Api.config.api_hash;
                }
            }
            // Se não encontrar, pode ser necessário procurar em outros objetos ou scripts

            return {
                localStorage: localStorageData,
                apiConfig: apiConfig, // Pode vir vazio se não for encontrado
                extractedAt: new Date().toISOString()
            };
        });

        // Adicionar uma nota sobre a necessidade de encontrar o api_id/hash se não foi encontrado
        if (!sessionData.apiConfig || !sessionData.apiConfig.api_id) {
            console.warn('AVISO: `api_id` e `api_hash` não foram encontrados automaticamente.');
            console.warn('Será necessário encontrá-los manualmente no código-fonte do Telegram Web.');
            sessionData.apiConfig.readme = 'api_id e api_hash precisam ser encontrados manualmente nos scripts da página.';
        }

        await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2));
        console.log(`Dados da sessão extraídos e salvos com sucesso em: ${sessionPath}`);

    } catch (error) {
        console.error(`Erro ao extrair os dados da sessão: ${error.message}`);
    }

    await browser.close();
    console.log('Navegador fechado. Processo concluído.');
}

run().catch(console.error);
