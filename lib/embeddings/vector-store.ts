import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { embeddingGenerator } from './generator';
import { ordinanceChunker } from './chunker';

export interface VectorSearchResult {
  id: string;
  content: string;
  sectionNumber?: string;
  sectionTitle?: string;
  similarity: number;
  ordinanceId: string;
}

export class VectorStore {
  /**
   * Process and store an ordinance with embeddings
   */
  async processOrdinance(ordinanceId: string, fullText: string): Promise<void> {
    try {
      // 1. Chunk the ordinance
      const chunks = ordinanceChunker.chunkOrdinance(fullText);
      
      // 2. Generate embeddings
      const chunksWithEmbeddings = await embeddingGenerator.generateEmbeddings(chunks);
      
      // 3. Store chunks with embeddings in database
      for (const { chunk, embedding } of chunksWithEmbeddings) {
        await prisma.$executeRaw`
          INSERT INTO "OrdinanceChunk" (
            id, 
            "ordinanceId", 
            "sectionNumber", 
            "sectionTitle", 
            content, 
            embedding, 
            "chunkIndex", 
            "startChar", 
            "endChar",
            "createdAt"
          ) VALUES (
            ${Prisma.sql`gen_random_uuid()`},
            ${ordinanceId},
            ${chunk.metadata.sectionNumber || null},
            ${chunk.metadata.sectionTitle || null},
            ${chunk.content},
            ${Prisma.sql`ARRAY[${Prisma.join(embedding)}]::vector`},
            ${chunk.metadata.chunkIndex},
            ${chunk.metadata.startChar},
            ${chunk.metadata.endChar},
            ${new Date()}
          )
        `;
      }
    } catch (error) {
      console.error('Error processing ordinance:', error);
      throw new Error('Failed to process ordinance for vector storage');
    }
  }

  /**
   * Search for relevant chunks using vector similarity
   */
  async searchSimilarChunks(
    query: string, 
    ordinanceId?: string,
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<VectorSearchResult[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await embeddingGenerator.generateQueryEmbedding(query);
      
      // Build the query
      let whereClause = Prisma.sql``;
      if (ordinanceId) {
        whereClause = Prisma.sql`WHERE "ordinanceId" = ${ordinanceId}`;
      }
      
      // Search using pgvector
      const results = await prisma.$queryRaw<VectorSearchResult[]>`
        SELECT 
          id,
          content,
          "sectionNumber",
          "sectionTitle",
          "ordinanceId",
          1 - (embedding <=> ${Prisma.sql`ARRAY[${Prisma.join(queryEmbedding)}]::vector`}) as similarity
        FROM "OrdinanceChunk"
        ${whereClause}
        WHERE 1 - (embedding <=> ${Prisma.sql`ARRAY[${Prisma.join(queryEmbedding)}]::vector`}) > ${threshold}
        ORDER BY embedding <=> ${Prisma.sql`ARRAY[${Prisma.join(queryEmbedding)}]::vector`}
        LIMIT ${limit}
      `;
      
      return results;
    } catch (error) {
      console.error('Error searching vectors:', error);
      throw new Error('Failed to search similar chunks');
    }
  }

  /**
   * Find chunks related to specific OPRA categories
   */
  async findChunksByCategory(
    ordinanceId: string,
    categoryKeywords: string[],
    limit: number = 20
  ): Promise<VectorSearchResult[]> {
    // Combine keywords into a search query
    const query = categoryKeywords.join(' ');
    return this.searchSimilarChunks(query, ordinanceId, limit, 0.6);
  }

  /**
   * Get all chunks for an ordinance (ordered)
   */
  async getOrdinanceChunks(ordinanceId: string) {
    return prisma.ordinanceChunk.findMany({
      where: { ordinanceId },
      orderBy: { chunkIndex: 'asc' },
    });
  }
}

export const vectorStore = new VectorStore();