import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ordinanceAnalyzer } from '@/lib/opra/analyzer';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ordinanceId = params.id;
    
    // Check if ordinance exists and has been processed
    const ordinance = await prisma.ordinance.findUnique({
      where: { id: ordinanceId },
      include: {
        chunks: {
          take: 1,
        },
      },
    });
    
    if (!ordinance) {
      return NextResponse.json(
        { error: 'Ordinance not found' },
        { status: 404 }
      );
    }
    
    if (ordinance.chunks.length === 0) {
      return NextResponse.json(
        { error: 'Ordinance must be processed before analysis' },
        { status: 400 }
      );
    }
    
    // Analyze the ordinance
    const { relevantCategories, analysis } = await ordinanceAnalyzer.analyzeOrdinance(ordinanceId);
    
    // Generate specific records for each category
    const recordsSummary = await ordinanceAnalyzer.generateRecordsSummary(
      ordinanceId,
      relevantCategories
    );
    
    return NextResponse.json({
      ordinanceId,
      relevantCategories,
      analysis,
      recordsSummary,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze ordinance' },
      { status: 500 }
    );
  }
}