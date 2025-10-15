const fs = require('fs').promises;
const path = require('path');

const RAW_LINKS_PATH = './data/raw_links.json';
const CATALOG_PATH = './data/content_catalog.json';

/**
 * Função para carregar o catálogo de conteúdo existente.
 * Se não existir, retorna um objeto vazio.
 */
async function carregarCatalogo() {
  try {
    const data = await fs.readFile(CATALOG_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📖 Catálogo não encontrado. Criando um novo.');
      return { content: [] }; // Retorna a estrutura base do catálogo.
    }
    throw error;
  }
}

/**
 * Função principal para processar os links brutos e atualizar o catálogo.
 */
async function processar() {
  console.log('🚀 Iniciando o processo de organização e catalogação...');

  let rawLinksData;
  try {
    const rawContent = await fs.readFile(RAW_LINKS_PATH, 'utf8');
    rawLinksData = JSON.parse(rawContent);
  } catch (error) {
    console.error(`❌ Erro ao ler o arquivo de links brutos: ${RAW_LINKS_PATH}`);
    process.exit(1);
  }

  const catalogo = await carregarCatalogo();
  let novidadesAdicionadas = 0;

  for (const item of rawLinksData) {
    const channelName = item.channel_name;
    for (const videoUrl of item.videos) {
      // Verifica se o vídeo já existe no catálogo para evitar duplicatas.
      const videoExistente = catalogo.content.find(v => v.source_url === videoUrl);

      if (!videoExistente) {
        console.log(`➕ Adicionando novo vídeo do canal "${channelName}"`);
        
        // Simula a lógica de download e organização.
        // No futuro, aqui entraria o código para baixar o vídeo e subí-lo para o GitHub Releases.
        const releaseUrl = `https://github.com/user/repo/releases/download/v1.0.0/${path.basename(videoUrl)}`;

        const novoVideo = {
          id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: path.basename(videoUrl, path.extname(videoUrl)), // Título extraído do nome do arquivo.
          source_channel: channelName,
          source_url: videoUrl,
          status: 'cataloged', // Status inicial. Pode ser 'downloaded', 'published', etc.
          release_url: releaseUrl, // URL do arquivo no GitHub Releases.
          metadata: {
            added_at: new Date().toISOString(),
            file_size: null, // Seria preenchido após o download.
            duration: null // Seria preenchido com ffprobe ou similar.
          }
        };
        catalogo.content.push(novoVideo);
        novidadesAdicionadas++;
      } else {
        console.log(`⏩ Vídeo já existente no catálogo, pulando: ${videoUrl}`);
      }
    }
  }

  if (novidadesAdicionadas > 0) {
    await fs.writeFile(CATALOG_PATH, JSON.stringify(catalogo, null, 2));
    console.log(`✅ Catálogo atualizado com ${novidadesAdicionadas} novo(s) item(ns).`);
  } else {
    console.log('🤷 Nenhum conteúdo novo para adicionar ao catálogo.');
  }

  console.log('🎉 Processo de organização finalizado.');
}

// Executa a função principal.
processar().catch(error => {
  console.error('❌ Ocorreu um erro inesperado durante o processamento:', error);
  process.exit(1);
});
