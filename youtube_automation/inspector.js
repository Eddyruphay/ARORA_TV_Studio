const puppeteer = require('puppeteer-core');

const TARGET_URL = 'https://www.pornpics.com/tags/';

async function inspectNetwork() {
  console.log('--- Network Inspector Initialized ---');
  console.log(`Launching Puppeteer to inspect: ${TARGET_URL}`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    const apiRequests = new Set();
    page.on('request', (request) => {
      const url = request.url();
      if (request.resourceType() === 'xhr' || url.includes('/api/')) {
        if (!url.includes('google') && !url.includes('adsystem')) {
          apiRequests.add(url);
        }
      }
    });

    console.log('\nNavigating to the page and waiting for network activity...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('\n--- Discovered Potential API Endpoints ---');
    if (apiRequests.size > 0) {
      apiRequests.forEach(url => console.log(`- ${url}`));
    } else {
      console.log('No specific API-like (XHR) requests were detected.');
    }

  } catch (error) {
    console.error('\nAn error occurred during inspection:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\nBrowser closed.');
    }
  }
}

inspectNetwork();
