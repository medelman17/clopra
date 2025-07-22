import { openai } from '@ai-sdk/openai';
import { embedMany, embed } from 'ai';
import { TextChunk } from './chunker';

export class EmbeddingGenerator {
  private model = openai.embedding('text-embedding-3-small');

  /**
   * Generate embeddings for multiple text chunks
   */
  async generateEmbeddings(chunks: TextChunk[]): Promise<{ chunk: TextChunk; embedding: number[] }[]> {
    try {
      const texts = chunks.map(chunk => chunk.content);
      
      // Generate embeddings in batches
      const batchSize = 20;
      const results: { chunk: TextChunk; embedding: number[] }[] = [];
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batchTexts = texts.slice(i, i + batchSize);
        const batchChunks = chunks.slice(i, i + batchSize);
        
        const { embeddings } = await embedMany({
          model: this.model,
          values: batchTexts,
        });
        
        // Combine chunks with their embeddings
        embeddings.forEach((embedding, index) => {
          results.push({
            chunk: batchChunks[index],
            embedding: embedding,
          });
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const { embedding } = await embed({
        model: this.model,
        value: text,
      });
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Generate embedding for a search query (may use different preprocessing)
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    // Preprocess query for better search results
    const processedQuery = `Search query: ${query}. Find relevant sections about: ${query}`;
    return this.generateEmbedding(processedQuery);
  }
}

export const embeddingGenerator = new EmbeddingGenerator();