import { OrdinanceSection } from '@/types/opra';

export interface ChunkMetadata {
  sectionNumber?: string;
  sectionTitle?: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
}

export interface TextChunk {
  content: string;
  metadata: ChunkMetadata;
}

export class OrdinanceChunker {
  private maxChunkSize: number;
  private overlapSize: number;

  constructor(maxChunkSize = 1500, overlapSize = 200) {
    this.maxChunkSize = maxChunkSize;
    this.overlapSize = overlapSize;
  }

  /**
   * Intelligently chunk an ordinance by sections
   */
  chunkOrdinance(fullText: string): TextChunk[] {
    // First, try to split by sections
    const sections = this.extractSections(fullText);
    
    if (sections.length > 0) {
      return this.chunkBySections(sections);
    }
    
    // Fallback to paragraph-based chunking
    return this.chunkByParagraphs(fullText);
  }

  private extractSections(text: string): OrdinanceSection[] {
    const sections: OrdinanceSection[] = [];
    
    // Common section patterns in municipal ordinances
    const sectionPatterns = [
      /§\s*([\d-]+)\s*[.-]?\s*([^\n]+)\n([\s\S]*?)(?=§\s*[\d-]+|$)/g,
      /Section\s*([\d.]+)\s*[.-]?\s*([^\n]+)\n([\s\S]*?)(?=Section\s*[\d.]+|$)/gi,
      /(\d+)\.\s*([^\n]+)\n([\s\S]*?)(?=\d+\.\s*[^\n]+|$)/g,
    ];

    for (const pattern of sectionPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        for (const match of matches) {
          sections.push({
            number: match[1].trim(),
            title: match[2].trim(),
            content: match[3].trim(),
            relevantCategories: [], // Will be populated by analyzer
          });
        }
        break;
      }
    }

    return sections;
  }

  private chunkBySections(sections: OrdinanceSection[]): TextChunk[] {
    const chunks: TextChunk[] = [];
    let currentPosition = 0;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionText = `§ ${section.number} - ${section.title}\n\n${section.content}`;
      
      if (sectionText.length <= this.maxChunkSize) {
        // Section fits in one chunk
        chunks.push({
          content: sectionText,
          metadata: {
            sectionNumber: section.number,
            sectionTitle: section.title,
            chunkIndex: chunks.length,
            startChar: currentPosition,
            endChar: currentPosition + sectionText.length,
          },
        });
      } else {
        // Split large sections into multiple chunks
        const subChunks = this.splitLargeSection(section, currentPosition);
        chunks.push(...subChunks);
      }
      
      currentPosition += sectionText.length;
    }

    return chunks;
  }

  private splitLargeSection(section: OrdinanceSection, startPosition: number): TextChunk[] {
    const chunks: TextChunk[] = [];
    const header = `§ ${section.number} - ${section.title}\n\n`;
    const content = section.content;
    
    // Split by paragraphs or sentences
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = header;
    let chunkStartChar = startPosition;

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > this.maxChunkSize && currentChunk.length > header.length) {
        // Save current chunk
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            sectionNumber: section.number,
            sectionTitle: section.title,
            chunkIndex: chunks.length,
            startChar: chunkStartChar,
            endChar: chunkStartChar + currentChunk.length,
          },
        });
        
        // Start new chunk with overlap
        const overlap = this.getOverlapText(currentChunk);
        currentChunk = `§ ${section.number} (continued)\n\n${overlap}${paragraph}\n\n`;
        chunkStartChar += currentChunk.length - overlap.length - paragraph.length;
      } else {
        currentChunk += paragraph + '\n\n';
      }
    }

    // Add final chunk
    if (currentChunk.length > header.length) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          sectionNumber: section.number,
          sectionTitle: section.title,
          chunkIndex: chunks.length,
          startChar: chunkStartChar,
          endChar: chunkStartChar + currentChunk.length,
        },
      });
    }

    return chunks;
  }

  private chunkByParagraphs(text: string): TextChunk[] {
    const chunks: TextChunk[] = [];
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';
    let currentPosition = 0;
    let chunkStartChar = 0;

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > this.maxChunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            chunkIndex: chunks.length,
            startChar: chunkStartChar,
            endChar: currentPosition,
          },
        });
        
        // Start new chunk with overlap
        const overlap = this.getOverlapText(currentChunk);
        currentChunk = overlap + paragraph + '\n\n';
        chunkStartChar = currentPosition - overlap.length;
      } else {
        currentChunk += paragraph + '\n\n';
      }
      
      currentPosition += paragraph.length + 2; // +2 for \n\n
    }

    // Add final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          chunkIndex: chunks.length,
          startChar: chunkStartChar,
          endChar: currentPosition,
        },
      });
    }

    return chunks;
  }

  private getOverlapText(text: string): string {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    let overlap = '';
    
    // Take last few sentences for overlap
    for (let i = sentences.length - 1; i >= 0 && overlap.length < this.overlapSize; i--) {
      overlap = sentences[i] + overlap;
    }
    
    return overlap.trim() + '\n\n';
  }
}

export const ordinanceChunker = new OrdinanceChunker();