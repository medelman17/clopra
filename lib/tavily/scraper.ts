import { tavily } from './client';

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

      // Score results to find the most relevant one
      const scoredResults = searchResults.results.map(result => {
        let score = 0;
        const lowerUrl = result.url.toLowerCase();
        const lowerTitle = result.title.toLowerCase();
        const lowerContent = result.content.toLowerCase();
        
        // URL scoring
        if (lowerUrl.includes('ecode360.com') || lowerUrl.includes('municode.com')) score += 10;
        if (lowerUrl.includes('code') || lowerUrl.includes('ordinance')) score += 5;
        if (lowerUrl.includes('rent')) score += 3;
        
        // Title scoring
        if (lowerTitle.includes('rent control')) score += 10;
        if (lowerTitle.includes('chapter') || lowerTitle.includes('article')) score += 5;
        if (lowerTitle.includes('ordinance')) score += 3;
        
        // Content scoring - check for legal document structure
        if (lowerContent.includes('section') && lowerContent.includes('shall')) score += 5;
        if (lowerContent.match(/§\s*\d+/)) score += 5;
        if (lowerContent.includes('definitions')) score += 3;
        
        // Penalize bad content
        if (lowerContent.includes('search results')) score -= 10;
        if (lowerContent.includes('no results found')) score -= 10;
        if (lowerContent.length < 500) score -= 5;
        
        return { result, score };
      });
      
      // Sort by score and pick the best one
      scoredResults.sort((a, b) => b.score - a.score);
      const ordinanceResult = scoredResults[0].result;
      
      console.log('Scraper: Selected result with score', scoredResults[0].score, 'from URL:', ordinanceResult.url);

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async fetchDetailedContent(_url: string): Promise<string | null> {
    // URL parameter reserved for future implementation
    // This would be implemented with a proper web scraping library
    // For now, we'll rely on Tavily's content
    return null;
  }
}

export const ordinanceScraper = new OrdinanceScraper();