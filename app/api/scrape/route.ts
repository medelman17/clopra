import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { ordinanceScraper } from '@/lib/tavily/scraper';
import { prisma } from '@/lib/db/prisma';
import { trackOrdinanceError } from '@/lib/sentry/tracking';

const ScrapeRequestSchema = z.object({
  municipalityName: z.string(),
  county: z.string().optional(),
  municipalityId: z.string().optional(), // Municipality ID for validation
});

export async function POST(request: NextRequest) {
  return Sentry.withMonitor('scrape-ordinance', async () => {
    let municipalityName = '';
    
    try {
      const body = await request.json();
      const parsed = ScrapeRequestSchema.parse(body);
      municipalityName = parsed.municipalityName;
      const county = parsed.county;
      const municipalityId = parsed.municipalityId;
      
      // Add breadcrumb for tracking
      Sentry.addBreadcrumb({
        category: 'api',
        message: 'Scraping ordinance',
        level: 'info',
        data: { municipalityName, county, municipalityId },
      });

    // Check if municipality already exists
    let municipality;
    
    if (municipalityId) {
      // Fetch by ID and validate it matches the name/county
      municipality = await prisma.municipality.findUnique({
        where: { id: municipalityId },
      });
      
      if (!municipality) {
        return NextResponse.json(
          { error: 'Municipality not found' },
          { status: 404 }
        );
      }
      
      // Validate the municipality matches what was requested
      if (municipality.name !== municipalityName) {
        console.warn(`Municipality name mismatch: DB has '${municipality.name}', request has '${municipalityName}'`);
        // Use the database values as the source of truth
        municipalityName = municipality.name;
      }
      
      if (county && municipality.county !== county) {
        console.warn(`County mismatch: DB has '${municipality.county}', request has '${county}'`);
      }
    } else {
      // Fallback to name-based lookup
      municipality = await prisma.municipality.findFirst({
        where: { 
          name: municipalityName,
          ...(county ? { county } : {}),
        },
      });
    }

    if (!municipality) {
      // Create municipality
      municipality = await prisma.municipality.create({
        data: {
          name: municipalityName,
          county: county || 'Unknown',
          state: 'NJ',
        },
      });
    }

    // Scrape ordinance with intelligent search fallback
    // Use the municipality's county from the database as the source of truth
    const searchCounty = municipality.county !== 'Unknown' ? municipality.county : county;
    let scrapedOrdinance = await ordinanceScraper.scrapeOrdinance(municipality.name, searchCounty);
    
    // Validate the scraped content
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (scrapedOrdinance) {
      const { validateOrdinanceContent } = await import('@/lib/agents/ordinance-agent-simple');
      const validation = await validateOrdinanceContent(scrapedOrdinance.fullText);
      confidence = validation.confidence;
      
      // If confidence is low, try Perplexity first, then intelligent search
      if (validation.confidence === 'low') {
        console.log('[API] Low confidence in scraped content, trying Perplexity search');
        const { perplexityOrdinanceSearch } = await import('@/lib/agents/perplexity-ordinance-agent');
        const perplexityResult = await perplexityOrdinanceSearch(municipality.name, searchCounty);
        
        if (perplexityResult.success && perplexityResult.content) {
          scrapedOrdinance = {
            title: perplexityResult.title || 'Rent Control Ordinance',
            fullText: perplexityResult.content,
            sourceUrl: perplexityResult.url || '',
          };
          confidence = perplexityResult.confidence || 'medium';
        } else {
          console.log('[API] Perplexity search failed, falling back to intelligent search');
          const { intelligentOrdinanceSearch } = await import('@/lib/agents/ordinance-agent-simple');
          const agentResult = await intelligentOrdinanceSearch(municipality.name, searchCounty);
          
          if (agentResult.success && agentResult.content) {
            scrapedOrdinance = {
              title: agentResult.title || 'Rent Control Ordinance',
              fullText: agentResult.content,
              sourceUrl: agentResult.url || '',
            };
            confidence = agentResult.confidence || 'medium';
          }
        }
      }
    } else {
      // No result from basic scraper, try Perplexity first, then fallback
      console.log('[API] No result from basic scraper, trying Perplexity search');
      const { perplexityOrdinanceSearch } = await import('@/lib/agents/perplexity-ordinance-agent');
      const perplexityResult = await perplexityOrdinanceSearch(municipalityName, county);
      
      if (perplexityResult.success && perplexityResult.content) {
        scrapedOrdinance = {
          title: perplexityResult.title || 'Rent Control Ordinance',
          fullText: perplexityResult.content,
          sourceUrl: perplexityResult.url || '',
        };
        confidence = perplexityResult.confidence || 'medium';
      } else {
        console.log('[API] Perplexity search failed, falling back to intelligent search');
        const { intelligentOrdinanceSearch } = await import('@/lib/agents/ordinance-agent-simple');
        const agentResult = await intelligentOrdinanceSearch(municipalityName, county);
        
        if (agentResult.success && agentResult.content) {
          scrapedOrdinance = {
            title: agentResult.title || 'Rent Control Ordinance',
            fullText: agentResult.content,
            sourceUrl: agentResult.url || '',
          };
          confidence = agentResult.confidence || 'medium';
        }
      }
    }
    
    if (!scrapedOrdinance) {
      return NextResponse.json(
        { error: 'No rent control ordinance found' },
        { status: 404 }
      );
    }

    // Save ordinance to database
    const ordinance = await prisma.ordinance.create({
      data: {
        municipalityId: municipality.id,
        title: scrapedOrdinance.title,
        code: scrapedOrdinance.code,
        fullText: scrapedOrdinance.fullText,
        sourceUrl: scrapedOrdinance.sourceUrl,
        effectiveDate: scrapedOrdinance.effectiveDate,
      },
    });

    // Scrape custodian info
    const scrapedCustodian = await ordinanceScraper.scrapeCustodian(municipality.name);
    
    let custodian = null;
    if (scrapedCustodian) {
      custodian = await prisma.custodian.create({
        data: {
          municipalityId: municipality.id,
          name: scrapedCustodian.name,
          title: scrapedCustodian.title,
          email: scrapedCustodian.email,
          phone: scrapedCustodian.phone,
          address: scrapedCustodian.address,
        },
      });
    }

    return NextResponse.json({
      municipality,
      ordinance: {
        ...ordinance,
        confidence,
      },
      custodian,
    });
    } catch (error) {
      console.error('Scraping error:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: error.errors },
          { status: 400 }
        );
      }

      // Track non-validation errors
      if (error instanceof Error) {
        trackOrdinanceError(
          municipalityName || 'unknown',
          'scrape',
          error
        );
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}