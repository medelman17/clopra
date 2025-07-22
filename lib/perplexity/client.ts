import { z } from 'zod';

const PerplexityMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

const PerplexityCitationSchema = z.object({
  url: z.string(),
  title: z.string(),
  snippet: z.string().optional(),
});

const PerplexityResponseSchema = z.object({
  id: z.string(),
  model: z.string(),
  object: z.literal('chat.completion'),
  created: z.number(),
  choices: z.array(z.object({
    index: z.number(),
    finish_reason: z.string(),
    message: PerplexityMessageSchema,
    delta: z.object({
      role: z.string().optional(),
      content: z.string().optional(),
    }).optional(),
  })),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
  citations: z.array(PerplexityCitationSchema).optional(),
});

export type PerplexityMessage = z.infer<typeof PerplexityMessageSchema>;
export type PerplexityCitation = z.infer<typeof PerplexityCitationSchema>;
export type PerplexityResponse = z.infer<typeof PerplexityResponseSchema>;

export class PerplexityClient {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai';

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY is required');
    }
    this.apiKey = apiKey;
  }

  async search(query: string, options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    returnCitations?: boolean;
  }): Promise<PerplexityResponse> {
    const messages: PerplexityMessage[] = [
      {
        role: 'system',
        content: 'You are a municipal ordinance research assistant specializing in New Jersey municipalities. When searching for ordinances, you MUST verify the municipality is in New Jersey and not in any other state. Always cite your sources with specific URLs from official sources like ecode360.com, municode.com, or official .gov websites. Never return results from municipalities in other states.',
      },
      {
        role: 'user',
        content: query,
      },
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'llama-3.1-sonar-small-128k-online',
        messages,
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.2,
        return_citations: options?.returnCitations ?? true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return PerplexityResponseSchema.parse(data);
  }

  async searchOrdinance(municipalityName: string, county?: string): Promise<{
    content: string;
    citations: PerplexityCitation[];
    query: string;
  }> {
    const queries = [
      `Find the rent control ordinance for ${municipalityName} in ${county ? `${county} County,` : ''} New Jersey. Only return results from New Jersey municipalities. Do not include results from other states. Include the full text or a link to the official municipal code.`,
      `What are the rent control laws in the ${county ? 'Township' : 'municipality'} of ${municipalityName}, ${county ? `${county} County,` : ''} New Jersey? Provide the specific ordinance text from ecode360.com or the official municipal website.`,
      `site:ecode360.com OR site:municode.com "${municipalityName}" "${county ? `${county} County` : ''}" "New Jersey" rent control ordinance`,
    ];

    // Try the first query with detailed request
    for (const query of queries) {
      try {
        console.log(`[Perplexity] Searching: ${query}`);
        const response = await this.search(query, {
          model: 'llama-3.1-sonar-large-128k-online', // Use larger model for better results
          maxTokens: 2000,
          temperature: 0.1, // Low temperature for factual information
        });

        const content = response.choices[0]?.message?.content || '';
        const citations = response.citations || [];

        if (content.length > 100 && citations.length > 0) {
          return {
            content,
            citations,
            query,
          };
        }
      } catch (error) {
        console.error(`[Perplexity] Error with query "${query}":`, error);
        continue; // Try next query
      }
    }

    throw new Error('No valid ordinance information found');
  }

  async validateOrdinanceContent(content: string, municipalityName: string): Promise<{
    isValid: boolean;
    confidence: 'high' | 'medium' | 'low';
    analysis: string;
  }> {
    const query = `Analyze this content and determine if it contains a valid rent control ordinance for ${municipalityName}, New Jersey:

${content}

Please answer:
1. Is this actually a rent control ordinance?
2. What confidence level would you assign (high/medium/low)?
3. What specific elements make this valid or invalid?

Respond with a structured analysis.`;

    try {
      const response = await this.search(query, {
        maxTokens: 500,
        temperature: 0.1,
      });

      const analysis = response.choices[0]?.message?.content || '';
      
      // Simple parsing of the response
      const isValid = analysis.toLowerCase().includes('valid') && 
                     !analysis.toLowerCase().includes('not valid') &&
                     !analysis.toLowerCase().includes('invalid');
      
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (analysis.toLowerCase().includes('high confidence')) {
        confidence = 'high';
      } else if (analysis.toLowerCase().includes('medium confidence')) {
        confidence = 'medium';
      }

      return {
        isValid,
        confidence,
        analysis,
      };
    } catch (error) {
      console.error('[Perplexity] Validation error:', error);
      return {
        isValid: false,
        confidence: 'low',
        analysis: 'Failed to validate content due to API error',
      };
    }
  }
}

// Export singleton instance
const apiKey = process.env.PERPLEXITY_API_KEY;
export const perplexity = apiKey ? new PerplexityClient(apiKey) : null;