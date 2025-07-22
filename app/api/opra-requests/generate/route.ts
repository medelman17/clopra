import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { ordinanceAnalyzer } from '@/lib/opra/analyzer';
import { OpraRequestGenerator } from '@/lib/opra/generator';

const GenerateRequestSchema = z.object({
  ordinanceId: z.string(),
  selectedCategories: z.array(z.string()).optional(),
  includeAllCategories: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ordinanceId, selectedCategories, includeAllCategories } = GenerateRequestSchema.parse(body);

    // Get ordinance with municipality and custodian
    const ordinance = await prisma.ordinance.findUnique({
      where: { id: ordinanceId },
      include: {
        municipality: {
          include: {
            custodians: {
              where: { isActive: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!ordinance) {
      return NextResponse.json(
        { error: 'Ordinance not found' },
        { status: 404 }
      );
    }

    // Analyze ordinance if categories not provided
    let categoriesToUse = selectedCategories;
    let recordsSummary: Record<string, string[]> = {};

    if (!categoriesToUse || includeAllCategories) {
      const { relevantCategories } = await ordinanceAnalyzer.analyzeOrdinance(ordinanceId);
      categoriesToUse = relevantCategories;
      recordsSummary = await ordinanceAnalyzer.generateRecordsSummary(ordinanceId, relevantCategories);
    } else {
      // Generate records summary for selected categories
      recordsSummary = await ordinanceAnalyzer.generateRecordsSummary(ordinanceId, categoriesToUse);
    }

    // Generate the request
    const generator = new OpraRequestGenerator();
    const requestText = generator.generateRequest({
      municipality: ordinance.municipality,
      ordinance,
      custodian: ordinance.municipality.custodians[0] || null,
      selectedCategories: categoriesToUse,
      recordsSummary,
    });

    // Save the request to database
    const opraRequest = await prisma.opraRequest.create({
      data: {
        municipalityId: ordinance.municipality.id,
        ordinanceId: ordinance.id,
        custodianId: ordinance.municipality.custodians[0]?.id,
        categories: categoriesToUse,
        requestText,
        status: 'DRAFT',
      },
    });

    return NextResponse.json({
      id: opraRequest.id,
      requestNumber: opraRequest.requestNumber,
      requestText,
      categories: categoriesToUse,
      recordsSummary,
      municipality: ordinance.municipality.name,
      custodian: ordinance.municipality.custodians[0] || null,
    });
  } catch (error) {
    console.error('Request generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate OPRA request' },
      { status: 500 }
    );
  }
}