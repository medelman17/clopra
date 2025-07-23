import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';

const UpdateDraftSchema = z.object({
  customizations: z.object({
    sections: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      category: z.string(),
      isCustom: z.boolean().optional(),
    })),
    selectedCategories: z.array(z.string()),
  }).optional(),
  requestText: z.string().optional(),
  status: z.enum(['DRAFT', 'READY', 'SUBMITTED']).optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
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

    return NextResponse.json(opraRequest);
  } catch (error) {
    console.error('Error fetching request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const data = UpdateDraftSchema.parse(body);

    // Verify the request exists and is in draft status
    const existingRequest = await prisma.opraRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    if (existingRequest.status !== 'DRAFT' && data.status !== 'READY') {
      return NextResponse.json(
        { error: 'Can only update draft requests' },
        { status: 400 }
      );
    }

    // Update the request
    const updatedRequest = await prisma.opraRequest.update({
      where: { id },
      data: {
        customizations: data.customizations || existingRequest.customizations || {},
        requestText: data.requestText || existingRequest.requestText,
        status: data.status || existingRequest.status,
        categories: data.customizations?.selectedCategories || (existingRequest.categories as string[]) || [],
      },
      include: {
        municipality: true,
        ordinance: true,
        custodian: true,
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Verify the request exists and is in draft status
    const existingRequest = await prisma.opraRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    if (existingRequest.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only delete draft requests' },
        { status: 400 }
      );
    }

    // Delete the request
    await prisma.opraRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting request:', error);
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    );
  }
}