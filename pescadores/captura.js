const puppeteer = require('puppeteer');
const fs = require('fs').promises;

/**
 * Função principal para capturar URLs do Telegram Web.
 */
async function capturar() {
  console.log('🚀 Iniciando o processo de captura...');

  // Lê a sessão do Telegram a partir da variável de ambiente (que virá do GitHub Secret).
  const telegramSessionJson = process.env.TELEGRAM_SESSION_JSON;
  if (!telegramSessionJson) {
    console.error('❌ Erro: A variável de ambiente TELEGRAM_SESSION_JSON não está definida.');
    console.error('Por favor, configure o secret no repositório do GitHub.');
    process.exit(1); // Encerra o script com erro.
  }

  // Analisa o JSON da sessão para obter os dados de login.
  const sessionData = JSON.parse(telegramSessionJson);
  console.log('🔑 Dados da sessão carregados da variável de ambiente.');

  const browser = await puppeteer.launch({
    headless: true, // Rodar em modo "headless" (sem interface gráfica) no GitHub Actions.
    args: [
      '--no-sandbox', // Necessário para rodar em ambientes de container como o do GitHub.
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();

  console.log('🖥️  Navegador iniciado. Injetando sessão no localStorage...');

  // Injeta os dados da sessão no localStorage ANTES de navegar para a página.
  // Isso faz com que o Telegram Web já carregue logado.
  await page.evaluateOnNewDocument(session => {
    // Itera sobre o objeto de sessão e define cada chave/valor no localStorage.
    // Esta abordagem é mais simples e direta.
    for (const key in session) {
      localStorage.setItem(key, session[key]);
    }
  }, sessionData);


  console.log('🔗 Navegando para o Telegram Web...');
  await page.goto('https://web.telegram.org/k/', {
    waitUntil: 'networkidle2' // Espera a rede ficar ociosa.
  });

  console.log('⏳ Aguardando a página carregar completamente após o login...');
  await new Promise(resolve => setTimeout(resolve, 10000)); // Espera 10 segundos.

  console.log('✅ Navegação concluída. A página deve estar logada.');

  // Tira um screenshot para depuração (útil no GitHub Actions para ver o que o bot está vendo).
  await page.screenshot({ path: 'debug_screenshot.png' });
  console.log('📸 Screenshot de depuração salvo em debug_screenshot.png');

  // A lógica de scraping para extrair os links virá aqui.
  // Por enquanto, vamos simular a extração.
  const linksExtraidos = [
    { channel_name: 'Canal Exemplo 1', videos: ['http://exemplo.com/video1.mp4'] },
    { channel_name: 'Canal Exemplo 2', videos: ['http://exemplo.com/video2.mp4'] }
  ];

  // Garante que o diretório de dados exista antes de salvar o arquivo.
  await fs.mkdir('./data', { recursive: true });

  // Salva os links extraídos em um arquivo temporário.
  await fs.writeFile('./data/raw_links.json', JSON.stringify(linksExtraidos, null, 2));
  console.log('📝 Links brutos salvos em data/raw_links.json');


  await browser.close();
  console.log('🎉 Processo de captura finalizado com sucesso.');
}

// Executa a função principal e captura quaisquer erros.
capturar().catch(error => {
  console.error('❌ Ocorreu um erro inesperado durante a captura:', error);
  process.exit(1);
});
