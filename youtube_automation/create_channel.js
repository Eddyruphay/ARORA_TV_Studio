const puppeteer = require('puppeteer');

async function createBrandChannel() {
  const channelName = process.env.CHANNEL_NAME;
  const cookiesString = process.env.YOUTUBE_COOKIES;

  if (!channelName || !cookiesString) {
    console.error('Error: CHANNEL_NAME and YOUTUBE_COOKIES environment variables must be set.');
    process.exit(1);
  }

  const cookies = cookiesString.split('; ').map(cookie => {
    const [name, ...valueParts] = cookie.split('=');
    return {
      name,
      value: valueParts.join('='),
      domain: '.youtube.com',
    };
  });

  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Setting cookies...');
    await page.setCookie(...cookies);

    const navigationUrl = 'https://www.youtube.com/channel_switcher?action_create_new_channel=1';
    console.log(`Navigating to ${navigationUrl}`);
    await page.goto(navigationUrl, { waitUntil: 'networkidle2' });
    
    console.log('Waiting for channel name input field...');
    // This selector targets the input field for the new channel name
    const inputSelector = 'input[aria-label="Nome do canal"]';
    await page.waitForSelector(inputSelector, { timeout: 15000 });
    
    console.log(`Typing channel name: "${channelName}"`);
    await page.type(inputSelector, channelName);

    console.log('Clicking confirmation checkbox...');
    // This selector targets the checkbox confirming understanding
    const checkboxSelector = 'input[type="checkbox"]';
    await page.waitForSelector(checkboxSelector);
    await page.click(checkboxSelector);

    console.log('Clicking the "Create" button...');
    // This selector targets the create button, which might be inside a dialog
    const createButtonSelector = 'button[aria-label="Criar"]';
    await page.waitForSelector(createButtonSelector, { visible: true });
    
    // Using page.evaluate to bypass potential click interception
    await page.evaluate((selector) => document.querySelector(selector).click(), createButtonSelector);

    console.log('Waiting for navigation to complete...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    console.log('Successfully created channel or navigated to the next page.');
    await page.screenshot({ path: 'success_screenshot.png' });
    console.log('Screenshot saved as success_screenshot.png');

  } catch (error) {
    console.error('An error occurred during the process:', error);
    if (browser) {
      const page = (await browser.pages())[0];
      await page.screenshot({ path: 'error_screenshot.png' });
      console.log('Error screenshot saved as error_screenshot.png');
    }
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed.');
    }
  }
}

createBrandChannel();
