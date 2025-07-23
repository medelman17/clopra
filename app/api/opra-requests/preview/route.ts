import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { ordinanceAnalyzer } from '@/lib/opra/analyzer';
import { OpraRequestGenerator } from '@/lib/opra/generator';
import { pdfStorage } from '@/lib/pdf/storage';

const PreviewRequestSchema = z.object({
  ordinanceId: z.string(),
  selectedCategories: z.array(z.string()).optional(),
  includeAllCategories: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ordinanceId, selectedCategories } = PreviewRequestSchema.parse(body);

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

    if (!categoriesToUse) {
      const { relevantCategories } = await ordinanceAnalyzer.analyzeOrdinance(ordinanceId);
      categoriesToUse = relevantCategories;
      recordsSummary = await ordinanceAnalyzer.generateRecordsSummary(ordinanceId, relevantCategories);
    } else {
      recordsSummary = await ordinanceAnalyzer.generateRecordsSummary(ordinanceId, categoriesToUse);
    }

    // Generate the request text
    const generator = new OpraRequestGenerator();
    const requestData = {
      municipality: ordinance.municipality,
      ordinance,
      custodian: ordinance.municipality.custodians[0] || null,
      selectedCategories: categoriesToUse,
      recordsSummary,
    };
    const requestText = generator.generateRequest(requestData);

    // Generate preview PDF (base64)
    const pdfBase64 = await pdfStorage.generatePreviewPdf(requestText, requestData);

    // Format categories with questions from recordsSummary
    const categoriesWithQuestions = categoriesToUse.map(categoryId => ({
      id: categoryId,
      name: categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      questions: recordsSummary[categoryId]?.join('\n') || '',
    }));

    return NextResponse.json({
      requestText,
      pdfBase64,
      categories: categoriesWithQuestions,
      recordsSummary,
    });
  } catch (error) {
    console.error('Preview generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}