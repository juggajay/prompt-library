import * as cheerio from 'cheerio';
import axios from 'axios';
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

export interface ScrapedContent {
  title: string;
  content: string;
  markdown: string;
  url: string;
  contentType: string;
}

export async function scrapeHTML(url: string): Promise<ScrapedContent> {
  try {
    const { data, headers } = await axios.get(url, {
      headers: {
        'User-Agent': 'DocReader Bot (AI Documentation Reader)',
      },
      timeout: 30000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(data);

    // Remove noise elements
    $('script, style, nav, footer, iframe, noscript, .advertisement, .ads, .sidebar').remove();

    // Try to find the main content area
    let mainContent = $('main, article, .content, .documentation, .docs, [role="main"]').first();

    // If no main content area found, use body
    if (mainContent.length === 0) {
      mainContent = $('body');
    }

    // Extract title - try multiple sources
    const title =
      $('h1').first().text() ||
      $('title').text() ||
      $('meta[property="og:title"]').attr('content') ||
      'Untitled Document';

    // Get HTML content
    const htmlContent = mainContent.html() || '';

    // Convert to plain text
    const textContent = mainContent
      .text()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n');

    // Convert to markdown
    const markdown = turndownService.turndown(htmlContent);

    return {
      title: title.trim(),
      content: textContent,
      markdown,
      url,
      contentType: headers['content-type'] || 'text/html',
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }
    throw error;
  }
}

export async function scrapeWithJina(url: string): Promise<ScrapedContent> {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const { data } = await axios.get(jinaUrl, {
      headers: {
        'X-Return-Format': 'markdown',
      },
      timeout: 30000,
    });

    // Jina AI returns markdown directly
    const markdown = typeof data === 'string' ? data : JSON.stringify(data);

    // Extract title from first heading
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled Document';

    // Convert markdown to plain text for content
    const content = markdown
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .trim();

    return {
      title,
      content,
      markdown,
      url,
      contentType: 'text/markdown',
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch with Jina AI: ${error.message}`);
    }
    throw error;
  }
}

export async function scrapeURL(url: string, preferJina = false): Promise<ScrapedContent> {
  if (preferJina) {
    try {
      return await scrapeWithJina(url);
    } catch (error) {
      console.warn('Jina AI failed, falling back to Cheerio:', error);
      return await scrapeHTML(url);
    }
  }

  try {
    return await scrapeHTML(url);
  } catch (error) {
    console.warn('Cheerio failed, falling back to Jina AI:', error);
    return await scrapeWithJina(url);
  }
}
