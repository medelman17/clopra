import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { vectorStore } from '@/lib/embeddings/vector-store';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ordinanceId = params.id;
    
    // Get the ordinance
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
    
    // Check if already processed
    if (ordinance.chunks.length > 0) {
      return NextResponse.json(
        { message: 'Ordinance already processed' },
        { status: 200 }
      );
    }
    
    // Process the ordinance
    await vectorStore.processOrdinance(ordinanceId, ordinance.fullText);
    
    // Get the processed chunks count
    const chunksCount = await prisma.ordinanceChunk.count({
      where: { ordinanceId },
    });
    
    return NextResponse.json({
      message: 'Ordinance processed successfully',
      ordinanceId,
      chunksCreated: chunksCount,
    });
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process ordinance' },
      { status: 500 }
    );
  }
}