import { perplexity } from '@/lib/perplexity/client';
import { tavily } from '@/lib/tavily/client';
import type { PerplexityCitation } from '@/lib/perplexity/client';

interface SearchResult {
  success: boolean;
  content?: string;
  url?: string;
  title?: string;
  confidence?: 'high' | 'medium' | 'low';
  reasoning?: string;
  citations?: PerplexityCitation[];
  source?: 'perplexity' | 'tavily';
}

export async function perplexityOrdinanceSearch(
  municipalityName: string,
  county?: string
): Promise<SearchResult> {
  if (!perplexity) {
    return {
      success: false,
      reasoning: 'Perplexity API key not configured',
    };
  }

  try {
    console.log(`[Perplexity Agent] Searching for ${municipalityName} ordinance`);
    
    // Step 1: Use Perplexity to find ordinance information
    const searchResult = await perplexity.searchOrdinance(municipalityName, county);
    
    console.log(`[Perplexity Agent] Found ${searchResult.citations.length} citations`);
    
    // Step 2: Validate the content using Perplexity's analysis
    const validation = await perplexity.validateOrdinanceContent(
      searchResult.content, 
      municipalityName
    );
    
    console.log(`[Perplexity Agent] Validation - Valid: ${validation.isValid}, Confidence: ${validation.confidence}`);
    
    if (!validation.isValid) {
      // Step 3: If Perplexity didn't find good content, try to extract from citations
      for (const citation of searchResult.citations) {
        if (citation.url && isLikelyOrdinanceUrl(citation.url)) {
          console.log(`[Perplexity Agent] Trying to fetch content from ${citation.url}`);
          
          // Use Tavily to get the full content from the URL
          try {
            const tavilyResult = await tavily.search(`site:${new URL(citation.url).hostname} ${municipalityName} rent control`, {
              maxResults: 1,
            });
            
            if (tavilyResult.results.length > 0) {
              const content = tavilyResult.results[0].content;
              
              // Validate this content
              const urlValidation = await perplexity.validateOrdinanceContent(content, municipalityName);
              
              if (urlValidation.isValid) {
                return {
                  success: true,
                  content,
                  url: citation.url,
                  title: citation.title,
                  confidence: urlValidation.confidence,
                  reasoning: `Found ordinance from Perplexity citation: ${citation.url}. ${urlValidation.analysis}`,
                  citations: searchResult.citations,
                  source: 'perplexity',
                };
              }
            }
          } catch (error) {
            console.log(`[Perplexity Agent] Failed to fetch from ${citation.url}:`, error);
            continue;
          }
        }
      }
      
      // If no citations worked, return the original search with low confidence
      return {
        success: false,
        reasoning: `Perplexity found information but validation failed: ${validation.analysis}`,
        citations: searchResult.citations,
        source: 'perplexity',
      };
    }
    
    // Step 4: If validation passed, try to find the best source URL
    let bestUrl = '';
    let bestTitle = municipalityName + ' Rent Control Ordinance';
    
    // Look for the most authoritative source
    const authoritativeCitation = searchResult.citations.find(c => 
      isLikelyOrdinanceUrl(c.url)
    );
    
    if (authoritativeCitation) {
      bestUrl = authoritativeCitation.url;
      bestTitle = authoritativeCitation.title;
    } else if (searchResult.citations.length > 0) {
      bestUrl = searchResult.citations[0].url;
      bestTitle = searchResult.citations[0].title;
    }
    
    return {
      success: true,
      content: searchResult.content,
      url: bestUrl,
      title: bestTitle,
      confidence: validation.confidence,
      reasoning: `Found ordinance via Perplexity with ${validation.confidence} confidence. ${validation.analysis}`,
      citations: searchResult.citations,
      source: 'perplexity',
    };
    
  } catch (error) {
    console.error('[Perplexity Agent] Error:', error);
    return {
      success: false,
      reasoning: `Perplexity search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'perplexity',
    };
  }
}

function isLikelyOrdinanceUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  
  // Municipal code sites
  if (lowerUrl.includes('ecode360.com')) return true;
  if (lowerUrl.includes('municode.com')) return true;
  if (lowerUrl.includes('generalcode.com')) return true;
  if (lowerUrl.includes('codepublishing.com')) return true;
  
  // Government sites
  if (lowerUrl.includes('.gov') && (
    lowerUrl.includes('ordinance') || 
    lowerUrl.includes('code') ||
    lowerUrl.includes('chapter')
  )) return true;
  
  // PDF documents
  if (lowerUrl.endsWith('.pdf') && (
    lowerUrl.includes('ordinance') ||
    lowerUrl.includes('rent')
  )) return true;
  
  return false;
}

export async function hybridOrdinanceSearch(
  municipalityName: string,
  county?: string
): Promise<SearchResult> {
  const results = await Promise.allSettled([
    perplexityOrdinanceSearch(municipalityName, county),
    // We could also run Tavily search in parallel
  ]);
  
  // For now, just return the Perplexity result
  const perplexityResult = results[0];
  
  if (perplexityResult.status === 'fulfilled') {
    return perplexityResult.value;
  } else {
    return {
      success: false,
      reasoning: 'All search methods failed',
      source: 'perplexity',
    };
  }
}