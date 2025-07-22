import { generateText } from 'ai';
import { getChatModel } from '@/lib/ai/config';
import { tavily } from '@/lib/tavily/client';
import type { TavilySearchResult } from '@/lib/tavily/client';

interface ValidationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  issues: string[];
}

export async function validateOrdinanceContent(content: string): Promise<ValidationResult> {
  const lowerContent = content.toLowerCase();
  const issues: string[] = [];
  
  // Check for rent control keywords
  const hasRentControl = /rent (control|stabilization|regulation)/.test(lowerContent);
  if (!hasRentControl) issues.push('No rent control keywords found');
  
  // Check for legal structure
  const hasLegalStructure = /(?:section|article|chapter|§)\s*\d+/.test(lowerContent);
  if (!hasLegalStructure) issues.push('No legal document structure found');
  
  // Check for suspicious content
  if (lowerContent.includes('search results')) issues.push('Contains search results text');
  if (lowerContent.includes('no results found')) issues.push('Contains "no results found"');
  if (lowerContent.includes('cookie policy')) issues.push('Contains website navigation/policy text');
  if (content.length < 1000) issues.push('Content too short (< 1000 chars)');
  
  // Calculate confidence
  const score = 
    (hasRentControl ? 40 : 0) +
    (hasLegalStructure ? 30 : 0) +
    (content.length > 2000 ? 20 : 0) +
    (issues.length === 0 ? 10 : 0);
  
  return {
    isValid: score > 50,
    confidence: score > 80 ? 'high' : score > 50 ? 'medium' : 'low',
    issues,
  };
}

export async function intelligentOrdinanceSearch(
  municipalityName: string,
  county?: string
): Promise<{
  success: boolean;
  content?: string;
  url?: string;
  title?: string;
  confidence?: 'high' | 'medium' | 'low';
  reasoning?: string;
}> {
  const model = getChatModel();
  
  try {
    // Try multiple search strategies
    const searchQueries = [
      `${municipalityName} rent control ordinance`,
      `${municipalityName} NJ rent control code`,
      `${municipalityName} New Jersey rent stabilization ordinance`,
      `"${municipalityName}" "rent control" filetype:pdf`,
    ];
    
    if (county) {
      searchQueries.push(`${municipalityName} ${county} County NJ rent control`);
    }
    
    let allResults: TavilySearchResult[] = [];
    
    // Try different search queries
    for (const query of searchQueries) {
      console.log(`[Agent] Searching with query: ${query}`);
      const searchResults = await tavily.search(query);
      
      if (searchResults.results.length > 0) {
        // Add unique results (avoid duplicates by URL)
        const existingUrls = new Set(allResults.map(r => r.url));
        const newResults = searchResults.results.filter(r => !existingUrls.has(r.url));
        allResults = [...allResults, ...newResults];
        
        // If we have enough results, stop searching
        if (allResults.length >= 10) break;
      }
    }
    
    if (!allResults.length) {
      return { success: false, reasoning: 'No search results found across multiple queries' };
    }
    
    console.log(`[Agent] Found ${allResults.length} unique results across searches`);
    
    // Step 2: Score and rank results
    const scoredResults = allResults.map(result => {
      let score = 0;
      const lowerUrl = result.url.toLowerCase();
      const lowerContent = result.content.toLowerCase();
      
      // Prioritize municipal code sites
      if (lowerUrl.includes('ecode360.com') || lowerUrl.includes('municode.com')) score += 50;
      if (lowerUrl.includes('generalcode.com')) score += 40;
      if (lowerUrl.includes('.gov')) score += 30;
      if (lowerUrl.includes('code') || lowerUrl.includes('ordinance')) score += 20;
      if (lowerUrl.includes('pdf')) score += 15;
      
      // Check content quality
      if (lowerContent.includes('rent control')) score += 30;
      if (lowerContent.includes('rent stabilization')) score += 25;
      if (lowerContent.includes('rental dwelling')) score += 20;
      if (lowerContent.includes('section') && lowerContent.includes('shall')) score += 20;
      if (lowerContent.includes('chapter') && /\d+/.test(result.content)) score += 15;
      if (lowerContent.length > 1000) score += 20;
      else if (lowerContent.length > 500) score += 10;
      
      // Penalize bad content
      if (lowerContent.includes('search results')) score -= 50;
      if (lowerContent.includes('no results found')) score -= 50;
      if (lowerContent.includes('page not found')) score -= 50;
      if (lowerContent.includes('404')) score -= 50;
      if (lowerContent.length < 200) score -= 20;
      
      return { result, score };
    });
    
    // Sort by score
    scoredResults.sort((a, b) => b.score - a.score);
    
    // Step 3: Try multiple results until we find a valid ordinance
    const maxAttempts = Math.min(5, scoredResults.length);
    const attemptDetails: string[] = [];
    
    for (let i = 0; i < maxAttempts; i++) {
      const candidate = scoredResults[i];
      console.log(`[Agent] Trying result ${i + 1}/${maxAttempts} - Score: ${candidate.score}, URL: ${candidate.result.url}`);
      
      // Validate the content
      const validation = await validateOrdinanceContent(candidate.result.content);
      
      if (validation.isValid) {
        console.log(`[Agent] Found valid ordinance on attempt ${i + 1}`);
        return {
          success: true,
          content: candidate.result.content,
          url: candidate.result.url,
          title: candidate.result.title,
          confidence: validation.confidence,
          reasoning: `Found ordinance with ${validation.confidence} confidence from ${candidate.result.url} (attempt ${i + 1}/${maxAttempts})`,
        };
      }
      
      // If validation fails on basic checks, try AI analysis
      console.log(`[Agent] Basic validation failed for result ${i + 1}, trying AI analysis`);
      
      // First, check if this might be a search results page that leads to the actual ordinance
      const lowerContent = candidate.result.content.toLowerCase();
      const mightBeSearchPage = lowerContent.includes('search results') || 
                                lowerContent.includes('found') || 
                                lowerContent.includes('results for');
      
      if (mightBeSearchPage && candidate.result.content.length < 500) {
        console.log(`[Agent] Result ${i + 1} appears to be a search page, skipping detailed analysis`);
        attemptDetails.push(`Attempt ${i + 1}: ${candidate.result.url} - Appears to be search results page`);
        continue;
      }
      
      const analysis = await generateText({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at identifying and extracting municipal ordinance text.',
          },
          {
            role: 'user',
            content: `Analyze this content and determine if it contains a rent control ordinance for ${municipalityName}, ${county || 'NJ'}. 
            
Content from ${candidate.result.url}:
${candidate.result.content}

If this is a rent control ordinance, respond with "VALID_ORDINANCE".
If not, explain what the content actually is in one sentence.`,
          },
        ],
      });
      
      if (analysis.text.includes('VALID_ORDINANCE')) {
        console.log(`[Agent] AI validated ordinance on attempt ${i + 1}`);
        return {
          success: true,
          content: candidate.result.content,
          url: candidate.result.url,
          title: candidate.result.title,
          confidence: 'medium', // AI validated, so medium confidence
          reasoning: `Found ordinance validated by AI from ${candidate.result.url} (attempt ${i + 1}/${maxAttempts})`,
        };
      }
      
      // Track what we tried
      attemptDetails.push(`Attempt ${i + 1}: ${candidate.result.url} - ${validation.issues.join('; ')}`);
    }
    
    // If we get here, none of the results were valid
    return {
      success: false,
      reasoning: `Tried ${maxAttempts} search results but none contained valid rent control ordinances. Details: ${attemptDetails.join(' | ')}`,
    };
    
  } catch (error) {
    console.error('[Agent] Error:', error);
    return {
      success: false,
      reasoning: `Error during search: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}