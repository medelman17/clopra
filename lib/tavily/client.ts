import { z } from 'zod';

const TavilySearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  content: z.string(),
  score: z.number(),
  publishedDate: z.string().nullable().optional(),
});

const TavilyResponseSchema = z.object({
  query: z.string(),
  answer: z.string().optional(),
  results: z.array(TavilySearchResultSchema),
});

export type TavilySearchResult = z.infer<typeof TavilySearchResultSchema>;
export type TavilyResponse = z.infer<typeof TavilyResponseSchema>;

export class TavilyClient {
  private apiKey: string;
  private baseUrl = 'https://api.tavily.com';

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      throw new Error('TAVILY_API_KEY is required');
    }
    this.apiKey = apiKey;
  }

  async search(query: string, options?: {
    searchDepth?: 'basic' | 'advanced';
    includeAnswer?: boolean;
    includeRawContent?: boolean;
    maxResults?: number;
    includeDomains?: string[];
    excludeDomains?: string[];
  }): Promise<TavilyResponse> {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        search_depth: options?.searchDepth || 'basic',
        include_answer: options?.includeAnswer ?? false,
        include_raw_content: options?.includeRawContent ?? false,
        max_results: options?.maxResults || 5,
        include_domains: options?.includeDomains,
        exclude_domains: options?.excludeDomains,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`);
    }

    const data = await response.json();
    return TavilyResponseSchema.parse(data);
  }

  async searchMunicipalOrdinance(municipality: string, county?: string, topic: string = 'rent control'): Promise<TavilyResponse> {
    // Build more specific queries based on available information
    const countyStr = county ? `"${county} County"` : '';
    
    // Try multiple search strategies to find the actual ordinance text
    const queries = [
      // Most specific - with county and site restrictions
      `"${municipality}" ${countyStr} "New Jersey" "rent control ordinance" full text site:ecode360.com OR site:municode.com`,
      // Direct ordinance search with county
      `"${municipality}" ${countyStr} New Jersey "rent control ordinance" full text site:.gov OR site:.nj.us`,
      // Municipal code search
      `"${municipality}" ${countyStr} NJ municipal code chapter rent control stabilization`,
      // Generic search
      `"${municipality}" New Jersey ${topic} ordinance regulations text`,
    ];
    
    // Use the most specific query
    const query = county ? queries[0] : queries[1];
    
    return this.search(query, {
      searchDepth: 'advanced',
      includeAnswer: true,
      maxResults: 10,
      includeDomains: ['.gov', '.nj.us', '.municode.com', '.ecode360.com'],
    });
  }

  async findMunicipalClerk(municipality: string): Promise<TavilyResponse> {
    const query = `${municipality} New Jersey municipal clerk contact OPRA custodian email phone`;
    
    return this.search(query, {
      searchDepth: 'basic',
      includeAnswer: true,
      maxResults: 5,
      includeDomains: ['.gov', '.nj.us'],
    });
  }
}

export const tavily = new TavilyClient(process.env.TAVILY_API_KEY);