import { generateText } from 'ai';
import { getChatModel } from '@/lib/ai/config';
import { tavily } from '@/lib/tavily/client';

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
    // Step 1: Search for ordinance
    console.log(`[Agent] Searching for ${municipalityName} ordinance`);
    const searchResults = await tavily.searchMunicipalOrdinance(municipalityName);
    
    if (!searchResults.results.length) {
      return { success: false, reasoning: 'No search results found' };
    }
    
    // Step 2: Score and rank results
    const scoredResults = searchResults.results.map(result => {
      let score = 0;
      const lowerUrl = result.url.toLowerCase();
      const lowerContent = result.content.toLowerCase();
      
      // Prioritize municipal code sites
      if (lowerUrl.includes('ecode360.com') || lowerUrl.includes('municode.com')) score += 50;
      if (lowerUrl.includes('code') || lowerUrl.includes('ordinance')) score += 20;
      
      // Check content quality
      if (lowerContent.includes('rent control')) score += 30;
      if (lowerContent.includes('section') && lowerContent.includes('shall')) score += 20;
      if (lowerContent.length > 500) score += 10;
      
      // Penalize bad content
      if (lowerContent.includes('search results')) score -= 50;
      
      return { result, score };
    });
    
    // Sort by score
    scoredResults.sort((a, b) => b.score - a.score);
    const bestResult = scoredResults[0];
    
    console.log(`[Agent] Best result score: ${bestResult.score}, URL: ${bestResult.result.url}`);
    
    // Step 3: Validate the content
    const validation = await validateOrdinanceContent(bestResult.result.content);
    
    if (!validation.isValid) {
      // Step 4: If validation fails, ask AI to analyze and extract
      console.log('[Agent] Validation failed, using AI to analyze');
      
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
            
Content from ${bestResult.result.url}:
${bestResult.result.content}

If this is a rent control ordinance, respond with "VALID_ORDINANCE".
If not, explain what the content actually is.`,
          },
        ],
      });
      
      if (!analysis.text.includes('VALID_ORDINANCE')) {
        return {
          success: false,
          reasoning: `Content validation failed: ${validation.issues.join(', ')}. AI analysis: ${analysis.text}`,
        };
      }
    }
    
    return {
      success: true,
      content: bestResult.result.content,
      url: bestResult.result.url,
      title: bestResult.result.title,
      confidence: validation.confidence,
      reasoning: `Found ordinance with ${validation.confidence} confidence from ${bestResult.result.url}`,
    };
    
  } catch (error) {
    console.error('[Agent] Error:', error);
    return {
      success: false,
      reasoning: `Error during search: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}