import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ordinanceScraper } from '@/lib/tavily/scraper';
import { prisma } from '@/lib/db/prisma';

const ScrapeRequestSchema = z.object({
  municipalityName: z.string(),
  county: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { municipalityName, county } = ScrapeRequestSchema.parse(body);

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

    // Scrape ordinance
    const scrapedOrdinance = await ordinanceScraper.scrapeOrdinance(municipalityName);
    
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
      ordinance,
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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}