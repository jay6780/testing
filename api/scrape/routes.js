import { NextResponse } from 'next/server';
const simpleVideoScraper = require('./scraper');

export async function GET(request) {
  // Set timeout (25 seconds to stay within Vercel's limits)
  const timeoutDuration = 25000;
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timeout - scraping took too long')), timeoutDuration)
  );

  try {
    console.log('Starting scraping process...');
    
    const videos = await Promise.race([
      simpleVideoScraper(),
      timeoutPromise
    ]);

    console.log(`Scraping completed! Found ${videos.length} videos`);

    return NextResponse.json({
      success: true,
      count: videos.length,
      data: videos,
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Optional: Handle POST requests if needed
export async function POST(request) {
  return NextResponse.json({
    message: 'Use GET method to scrape videos'
  }, { status: 200 });
}