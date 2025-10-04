import { OpenAI } from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Fetches and extracts text content from a URL
 */
async function fetchDocumentation(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DocReaderBot/1.0)',
      },
      timeout: 30000, // 30 second timeout
    });

    const $ = cheerio.load(response.data);

    // Remove script, style, and navigation elements
    $('script, style, nav, header, footer, aside, .sidebar, .navigation').remove();

    // Extract main content
    const mainContent = $('main, article, .content, .documentation, .doc-content, body')
      .first()
      .text()
      .trim();

    // Clean up whitespace
    const cleanedContent = mainContent
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Extract title
    const title = $('h1').first().text().trim() || $('title').text().trim() || 'Untitled';

    return {
      title,
      content: cleanedContent,
      url,
    };
  } catch (error) {
    console.error('[PROCESSOR] Failed to fetch documentation:', error.message);
    throw new Error(`Failed to fetch documentation: ${error.message}`);
  }
}

/**
 * Generates an implementation guide using OpenAI
 */
async function generateGuide(content, url) {
  try {
    const prompt = `You are a technical documentation expert. Analyze the following documentation and create a comprehensive implementation guide.

Documentation URL: ${url}

Documentation Content:
${content.substring(0, 12000)}

Please create a detailed implementation guide that includes:

1. **Overview**: A brief summary of what this documentation covers
2. **Key Concepts**: Main concepts and terminology explained
3. **Quick Start**: Step-by-step guide to get started
4. **Common Use Cases**: Practical examples and patterns
5. **Best Practices**: Important tips and recommendations
6. **Common Pitfalls**: Things to avoid and troubleshooting tips
7. **Code Examples**: Practical code snippets with explanations

Format the response in clear, well-structured markdown. Make it practical and actionable for developers.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful technical documentation assistant that creates clear, practical implementation guides.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const processedContent = completion.choices[0].message.content;

    return {
      processedContent,
      metadata: {
        model: 'gpt-4o',
        tokensUsed: completion.usage.total_tokens,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('[PROCESSOR] Failed to generate guide:', error.message);
    throw new Error(`Failed to generate guide: ${error.message}`);
  }
}

/**
 * Main processing function
 */
export async function processDocumentation(url, guideId, supabase) {
  try {
    console.log(`[PROCESSOR] Starting processing for guide ${guideId}`);

    // Update status to processing
    await supabase
      .from('guides')
      .update({ processing_status: 'processing' })
      .eq('id', guideId);

    // Fetch documentation
    console.log(`[PROCESSOR] Fetching documentation from ${url}`);
    const docData = await fetchDocumentation(url);

    // Update guide with title
    await supabase
      .from('guides')
      .update({ title: docData.title })
      .eq('id', guideId);

    // Generate implementation guide
    console.log(`[PROCESSOR] Generating guide with AI`);
    const { processedContent, metadata } = await generateGuide(docData.content, url);

    // Store processed content
    const { error: contentError } = await supabase
      .from('guide_content')
      .insert({
        guide_id: guideId,
        raw_content: docData.content.substring(0, 50000), // Limit raw content size
        processed_content: { markdown: processedContent },
        metadata,
      });

    if (contentError) {
      throw new Error(`Failed to store content: ${contentError.message}`);
    }

    // Update guide status to completed
    await supabase
      .from('guides')
      .update({
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', guideId);

    console.log(`[PROCESSOR] Successfully completed processing for guide ${guideId}`);

    return {
      success: true,
      guideId,
      title: docData.title,
    };
  } catch (error) {
    console.error(`[PROCESSOR] Error processing guide ${guideId}:`, error);

    // Update guide status to failed
    await supabase
      .from('guides')
      .update({
        processing_status: 'failed',
        error_message: error.message,
      })
      .eq('id', guideId);

    throw error;
  }
}
