import { tavily } from './client';
import { prisma } from '@/lib/db/prisma';

export interface ScrapedOrdinance {
  title: string;
  code?: string;
  fullText: string;
  sourceUrl: string;
  effectiveDate?: Date;
}

export interface ScrapedCustodian {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  address?: string;
}

export class OrdinanceScraper {
  async scrapeOrdinance(municipalityName: string): Promise<ScrapedOrdinance | null> {
    try {
      // Search for the rent control ordinance
      const searchResults = await tavily.searchMunicipalOrdinance(municipalityName);
      
      if (!searchResults.results.length) {
        return null;
      }

      // Find the most relevant result (usually municipal code or ordinance page)
      const ordinanceResult = searchResults.results.find(
        r => r.url.includes('code') || r.url.includes('ordinance') || r.title.toLowerCase().includes('rent')
      ) || searchResults.results[0];

      // Extract ordinance details from the content
      const ordinance: ScrapedOrdinance = {
        title: this.extractTitle(ordinanceResult.title, ordinanceResult.content),
        code: this.extractCode(ordinanceResult.content),
        fullText: ordinanceResult.content,
        sourceUrl: ordinanceResult.url,
      };

      // Try to fetch more detailed content if we have a direct ordinance URL
      if (ordinanceResult.url.includes('ecode360') || ordinanceResult.url.includes('municode')) {
        const detailedContent = await this.fetchDetailedContent(ordinanceResult.url);
        if (detailedContent) {
          ordinance.fullText = detailedContent;
        }
      }

      return ordinance;
    } catch (error) {
      console.error('Error scraping ordinance:', error);
      return null;
    }
  }

  async scrapeCustodian(municipalityName: string): Promise<ScrapedCustodian | null> {
    try {
      const searchResults = await tavily.findMunicipalClerk(municipalityName);
      
      if (!searchResults.results.length) {
        return null;
      }

      // Extract custodian info from search results
      const custodianInfo = this.extractCustodianInfo(
        searchResults.answer || '',
        searchResults.results[0].content
      );

      return custodianInfo;
    } catch (error) {
      console.error('Error scraping custodian:', error);
      return null;
    }
  }

  private extractTitle(title: string, content: string): string {
    // Look for rent control chapter/article title
    const titleMatch = content.match(/(?:Chapter|Article|§)\s*[\d-]+[:\s]+([^.]+)/i);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    
    // Fallback to page title
    return title.replace(/[|-]\s*.*$/, '').trim();
  }

  private extractCode(content: string): string | undefined {
    // Look for chapter/section numbers
    const codeMatch = content.match(/(?:Chapter|Article|§)\s*([\d-]+)/i);
    return codeMatch ? `§ ${codeMatch[1]}` : undefined;
  }

  private extractCustodianInfo(answer: string, content: string): ScrapedCustodian | null {
    const combined = `${answer} ${content}`;
    
    // Extract email
    const emailMatch = combined.match(/[\w.-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : undefined;

    // Extract phone
    const phoneMatch = combined.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : undefined;

    // Extract name (usually near "Clerk" or "Custodian")
    const nameMatch = combined.match(/(?:clerk|custodian)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    const name = nameMatch ? nameMatch[1] : 'Municipal Clerk';

    if (!email && !phone) {
      return null;
    }

    return {
      name,
      title: 'Municipal Clerk / OPRA Custodian',
      email,
      phone,
    };
  }

  private async fetchDetailedContent(url: string): Promise<string | null> {
    // This would be implemented with a proper web scraping library
    // For now, we'll rely on Tavily's content
    return null;
  }
}

export const ordinanceScraper = new OrdinanceScraper();