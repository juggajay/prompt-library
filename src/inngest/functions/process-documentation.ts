import { inngest } from '../client';
import { supabase } from '../../lib/supabase';
import { scrapeURL } from '../../lib/doc-reader/scrapers/html';
import { parsePDF } from '../../lib/doc-reader/scrapers/pdf';
import { fetchGitHubRelease } from '../../lib/doc-reader/scrapers/github';
import { chunkWithSections, generateEmbeddings } from '../../lib/doc-reader/text-processing';
import { generateImplementationGuide } from '../../lib/doc-reader/guide-generation';

export const processDocumentation = inngest.createFunction(
  {
    id: 'process-documentation',
    name: 'Process Documentation',
    retries: 2,
  },
  { event: 'guide/process.requested' },
  async ({ event, step }) => {
    const { guideId, url } = event.data;

    try {
      // Step 1: Update status to processing
      await step.run('update-status-processing', async () => {
        await supabase
          .from('guides')
          .update({ processing_status: 'processing' })
          .eq('id', guideId);
      });

      // Step 2: Scrape content
      const scrapedContent = await step.run('scrape-content', async () => {
        // Determine content type and scrape accordingly
        if (url.endsWith('.pdf')) {
          return await parsePDF(url);
        } else if (url.includes('github.com') && url.includes('/releases')) {
          return await fetchGitHubRelease(url);
        } else {
          return await scrapeURL(url);
        }
      });

      // Step 3: Generate implementation guide
      const generatedGuide = await step.run('generate-guide', async () => {
        return await generateImplementationGuide(
          scrapedContent.markdown,
          scrapedContent.title,
          url
        );
      });

      // Step 4: Chunk content for RAG
      const chunks = await step.run('chunk-content', async () => {
        return await chunkWithSections(scrapedContent.markdown, 1000, 200);
      });

      // Step 5: Generate embeddings
      const chunksWithEmbeddings = await step.run('generate-embeddings', async () => {
        return await generateEmbeddings(chunks);
      });

      // Step 6: Store everything in database
      await step.run('store-data', async () => {
        // Store guide content
        await supabase.from('guide_content').upsert({
          guide_id: guideId,
          raw_content: scrapedContent.content,
          processed_content: generatedGuide.guide,
          metadata: {
            tokensUsed: generatedGuide.tokensUsed,
            model: generatedGuide.model,
            sourceTitle: scrapedContent.title,
            contentType: scrapedContent.contentType,
          },
        });

        // Store chunks with embeddings
        const chunkRecords = chunksWithEmbeddings.map((chunk) => ({
          guide_id: guideId,
          chunk_index: chunk.index,
          content: chunk.content,
          embedding: chunk.embedding,
          section_title: chunk.sectionTitle,
        }));

        // Insert in batches of 100
        for (let i = 0; i < chunkRecords.length; i += 100) {
          const batch = chunkRecords.slice(i, i + 100);
          await supabase.from('guide_chunks').insert(batch);
        }

        // Update guide status
        await supabase
          .from('guides')
          .update({
            title: scrapedContent.title,
            processing_status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', guideId);
      });

      // Send completion event
      await inngest.send({
        name: 'guide/process.completed',
        data: {
          guideId,
          success: true,
        },
      });

      return { success: true, guideId };
    } catch (error) {
      // Update guide with error status
      await supabase
        .from('guides')
        .update({
          processing_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', guideId);

      // Send failure event
      await inngest.send({
        name: 'guide/process.completed',
        data: {
          guideId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }
);
