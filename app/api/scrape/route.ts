import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { ordinanceScraper } from '@/lib/tavily/scraper';
import { prisma } from '@/lib/db/prisma';
import { trackOrdinanceError } from '@/lib/sentry/tracking';

const ScrapeRequestSchema = z.object({
  municipalityName: z.string(),
  county: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return Sentry.withMonitor('scrape-ordinance', async () => {
    let municipalityName = '';
    
    try {
      const body = await request.json();
      const parsed = ScrapeRequestSchema.parse(body);
      municipalityName = parsed.municipalityName;
      const county = parsed.county;
      
      // Add breadcrumb for tracking
      Sentry.addBreadcrumb({
        category: 'api',
        message: 'Scraping ordinance',
        level: 'info',
        data: { municipalityName, county },
      });

    // Check if municipality already exists
    let municipality = await prisma.municipality.findUnique({
      where: { name: municipalityName },
    });

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
    let scrapedOrdinance = await ordinanceScraper.scrapeOrdinance(municipalityName);
    
    // Validate the scraped content
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (scrapedOrdinance) {
      const { validateOrdinanceContent } = await import('@/lib/agents/ordinance-agent-simple');
      const validation = await validateOrdinanceContent(scrapedOrdinance.fullText);
      confidence = validation.confidence;
      
      // If confidence is low, try intelligent search
      if (validation.confidence === 'low') {
        console.log('[API] Low confidence in scraped content, trying intelligent search');
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
    } else {
      // No result from basic scraper, try intelligent search
      console.log('[API] No result from basic scraper, trying intelligent search');
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
    const scrapedCustodian = await ordinanceScraper.scrapeCustodian(municipalityName);
    
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