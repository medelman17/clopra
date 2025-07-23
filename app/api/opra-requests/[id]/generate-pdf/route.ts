import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { pdfStorage } from '@/lib/pdf/storage';

const GeneratePdfSchema = z.object({
  requestText: z.string(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { requestText } = GeneratePdfSchema.parse(body);

    // Get the draft request with all relations
    const opraRequest = await prisma.opraRequest.findUnique({
      where: { id },
      include: {
        municipality: true,
        ordinance: true,
        custodian: true,
      },
    });

    if (!opraRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    if (opraRequest.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Request has already been finalized' },
        { status: 400 }
      );
    }

    // Generate and upload PDF
    const requestData = {
      municipality: opraRequest.municipality,
      ordinance: opraRequest.ordinance,
      custodian: opraRequest.custodian,
      selectedCategories: opraRequest.categories as string[],
      recordsSummary: {}, // This would be populated from customizations if needed
    };

    const pdfUrl = await pdfStorage.generateAndStorePdf(
      opraRequest.id,
      requestText,
      requestData
    );

    // Update request status and add PDF URL
    const updatedRequest = await prisma.opraRequest.update({
      where: { id },
      data: {
        status: 'READY',
        requestText,
        pdfUrl,
      },
      include: {
        municipality: true,
        ordinance: true,
        custodian: true,
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('PDF generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}