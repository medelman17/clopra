import { tavily } from './client';
import { 
  validateMunicipalityMatch,
  scoreMunicipalityUrl 
} from '@/lib/search/municipality-validator';

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
  async scrapeOrdinance(municipalityName: string, county?: string): Promise<ScrapedOrdinance | null> {
    try {
      // Search for the rent control ordinance with better query
      const searchResults = await tavily.searchMunicipalOrdinance(municipalityName, county);
      
      if (!searchResults.results.length) {
        return null;
      }

      // Score results to find the most relevant one
      const scoredResults = searchResults.results.map(result => {
        // First validate this is the correct municipality
        const municipalityValidation = validateMunicipalityMatch(
          result.content,
          municipalityName,
          county
        );
        
        // If it's not the right municipality, heavily penalize
        if (!municipalityValidation.isMatch) {
          console.log(`Skipping result from ${result.url} - wrong municipality: ${municipalityValidation.issues.join(', ')}`);
          return { result, score: -100 };
        }
        
        // Score the URL
        let score = scoreMunicipalityUrl(result.url, municipalityName);
        
        // Add municipality confidence
        score += municipalityValidation.confidence;
        
        const lowerContent = result.content.toLowerCase();
        
        // Content scoring - check for rent control specific content
        if (lowerContent.includes('rent control')) score += 30;
        if (lowerContent.includes('rent stabilization')) score += 25;
        if (lowerContent.includes('rental dwelling')) score += 20;
        
        // Legal document structure
        if (lowerContent.match(/§\s*\d+/)) score += 15;
        if (lowerContent.includes('section') && lowerContent.includes('shall')) score += 15;
        if (lowerContent.includes('definitions')) score += 10;
        
        // Penalize bad content
        if (lowerContent.includes('search results')) score -= 50;
        if (lowerContent.includes('no results found')) score -= 50;
        if (lowerContent.length < 500) score -= 20;
        
        console.log(`Scored ${result.url}: ${score} (Municipality match: ${municipalityValidation.confidence})`);
        
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