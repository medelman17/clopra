import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { generateRequestNumber } from '@/lib/opra/request-number';

const CreateDraftSchema = z.object({
  ordinanceId: z.string(),
  municipalityId: z.string(),
  custodianId: z.string().optional().nullable(),
  customizations: z.object({
    sections: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      category: z.string(),
      isCustom: z.boolean().optional(),
    })),
    selectedCategories: z.array(z.string()),
  }),
  requestText: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateDraftSchema.parse(body);

    // Create draft OPRA request
    const opraRequest = await prisma.opraRequest.create({
      data: {
        municipalityId: data.municipalityId,
        ordinanceId: data.ordinanceId,
        custodianId: data.custodianId,
        requestNumber: generateRequestNumber(),
        status: 'DRAFT',
        categories: data.customizations.selectedCategories,
        customizations: data.customizations,
        requestText: data.requestText,
      },
      include: {
        municipality: true,
        ordinance: true,
        custodian: true,
      },
    });

    return NextResponse.json(opraRequest);
  } catch (error) {
    console.error('Draft creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create draft' },
      { status: 500 }
    );
  }
}