import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const municipality = await prisma.municipality.findUnique({
      where: { id },
      include: {
        ordinances: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        custodians: {
          select: {
            id: true,
            name: true,
            email: true,
          },
          take: 1,
        },
      },
    });

    if (!municipality) {
      return NextResponse.json(
        { error: 'Municipality not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(municipality);
  } catch (error) {
    console.error('Error fetching municipality:', error);
    return NextResponse.json(
      { error: 'Failed to fetch municipality' },
      { status: 500 }
    );
  }
}