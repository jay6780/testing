const puppeteer = require('puppeteer-core');
const chrome = require('chrome-aws-lambda');

async function simpleVideoScraper() {
  let browser = null;

  try {
    // Launch browser for Vercel environment
    browser = await puppeteer.launch({
      args: [...chrome.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const url = 'https://batibot.org/load_more_random.php?start=0&limit=20';
    console.log('Navigating to:', url);
    
    // Navigate to page
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for page to load
    await page.waitForTimeout(5000);

    // Extract video data
    const videoData = await page.evaluate(() => {
      const videos = [];

      // Look for video elements
      const videoElements = document.querySelectorAll('video, iframe');
      videoElements.forEach(video => {
        // Get title from multiple possible sources
        let title = video.getAttribute('title') || 
                   video.getAttribute('alt') ||
                   video.getAttribute('data-title') ||
                   video.closest('div')?.getAttribute('data-title') ||
                   video.closest('article')?.querySelector('h1, h2, h3, h4, h5, h6')?.innerText?.trim() ||
                   video.closest('div')?.querySelector('h1, h2, h3, h4, h5, h6')?.innerText?.trim();

        const videoUrl = video.src || video.getAttribute('src');
        const thumbnail = video.poster || video.getAttribute('poster');

        // Only add if ALL three fields are not empty
        if (videoUrl && thumbnail && title) {
          videos.push({
            type: video.tagName,
            videoUrl: videoUrl,
            thumbnail: thumbnail,
            title: title
          });
        }
      });

      // Look for containers with video data
      const containers = document.querySelectorAll('div, article, section');
      containers.forEach(container => {
        const videoUrl = container.getAttribute('data-video-url') || 
                       container.getAttribute('data-video') ||
                       container.querySelector('a')?.href;
        
        const thumbnail = container.getAttribute('data-thumbnail') ||
                        container.getAttribute('data-poster') ||
                        container.querySelector('img')?.src;

        // Enhanced title extraction from containers
        let title = container.getAttribute('data-title') ||
                  container.getAttribute('title') ||
                  container.getAttribute('aria-label') ||
                  container.querySelector('h1, h2, h3, h4, h5, h6')?.innerText?.trim() ||
                  container.querySelector('[class*="title"], [class*="name"], [class*="heading"]')?.innerText?.trim() ||
                  container.querySelector('img')?.getAttribute('alt') ||
                  container.querySelector('a')?.getAttribute('title');

        // Only add if ALL three fields are not empty
        if (videoUrl && thumbnail && title) {
          videos.push({
            type: 'container',
            videoUrl: videoUrl,
            thumbnail: thumbnail,
            title: title
          });
        }
      });

      return videos;
    });

    // Filter videos
    const filteredVideos = videoData.filter(item => item.videoUrl && item.thumbnail && item.title);
    console.log(`Found ${filteredVideos.length} videos with all three fields`);
    
    return filteredVideos;

  } catch (error) {
    console.error('Error during scraping:', error);
    throw new Error(`Scraping failed: ${error.message}`);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

module.exports = simpleVideoScraper;