import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { intelligentOrdinanceSearch, validateOrdinanceContent } from '@/lib/agents/ordinance-agent-simple';
import { ordinanceScraper } from '@/lib/tavily/scraper';

const AgentScrapeSchema = z.object({
  municipalityName: z.string(),
  county: z.string().optional(),
  useFullAgent: z.boolean().optional().default(false),
  usePerplexity: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { municipalityName, county, useFullAgent, usePerplexity } = AgentScrapeSchema.parse(body);
    
    console.log(`[API] Agent scrape request for ${municipalityName} (Perplexity: ${usePerplexity})`);
    
    if (usePerplexity) {
      // Use Perplexity search
      const { perplexityOrdinanceSearch } = await import('@/lib/agents/perplexity-ordinance-agent');
      const result = await perplexityOrdinanceSearch(municipalityName, county);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          ordinance: {
            title: result.title || 'Rent Control Ordinance',
            content: result.content,
            url: result.url,
            confidence: result.confidence,
          },
          reasoning: [result.reasoning || ''],
          citations: result.citations || [],
          source: result.source,
        });
      } else {
        return NextResponse.json({
          success: false,
          reasoning: [result.reasoning || ''],
          source: result.source,
        });
      }
    } else if (useFullAgent) {
      // Use intelligent search
      const result = await intelligentOrdinanceSearch(municipalityName, county);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          ordinance: {
            title: result.title || 'Rent Control Ordinance',
            content: result.content,
            url: result.url,
            confidence: result.confidence,
          },
          reasoning: [result.reasoning],
        });
      } else {
        return NextResponse.json({
          success: false,
          reasoning: [result.reasoning],
        });
      }
    } else {
      // Use regular scraper with validation
      const scraped = await ordinanceScraper.scrapeOrdinance(municipalityName, county);
      
      if (!scraped) {
        return NextResponse.json(
          { error: 'No ordinance found', success: false },
          { status: 404 }
        );
      }
      
      const validation = await validateOrdinanceContent(scraped.fullText);
      
      return NextResponse.json({
        success: true,
        ordinance: {
          title: scraped.title,
          content: scraped.fullText,
          url: scraped.sourceUrl,
          confidence: validation.confidence,
        },
        validation,
      });
    }
  } catch (error) {
    console.error('[API] Agent scrape error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Agent failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}