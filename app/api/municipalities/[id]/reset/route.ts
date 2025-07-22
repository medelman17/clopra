import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import * as Sentry from '@sentry/nextjs';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  return Sentry.withMonitor('reset-municipality', async () => {
    try {
      // Check if municipality exists
      const municipality = await prisma.municipality.findUnique({
        where: { id },
        include: {
          ordinances: {
            include: {
              chunks: true,
              opraRequests: true,
            },
          },
        },
      });

      if (!municipality) {
        return NextResponse.json(
          { error: 'Municipality not found' },
          { status: 404 }
        );
      }

      // Prevent reset if there are OPRA requests
      const hasOpraRequests = municipality.ordinances.some(o => o.opraRequests.length > 0);
      if (hasOpraRequests) {
        return NextResponse.json(
          { 
            error: 'Cannot reset municipality with existing OPRA requests',
            detail: 'This municipality has associated OPRA requests. Delete them first or use force=true parameter.' 
          },
          { status: 400 }
        );
      }

      // Start a transaction to delete all related data
      const result = await prisma.$transaction(async (tx) => {
        // Delete all chunks first
        const chunksDeleted = await tx.ordinanceChunk.deleteMany({
          where: {
            ordinance: {
              municipalityId: id,
            },
          },
        });

        // Delete all ordinances
        const ordinancesDeleted = await tx.ordinance.deleteMany({
          where: {
            municipalityId: id,
          },
        });

        // Delete custodian if exists
        const custodiansDeleted = await tx.custodian.deleteMany({
          where: {
            municipalityId: id,
          },
        });

        return {
          chunksDeleted: chunksDeleted.count,
          ordinancesDeleted: ordinancesDeleted.count,
          custodiansDeleted: custodiansDeleted.count,
        };
      });

      // Log the reset action
      Sentry.addBreadcrumb({
        category: 'municipality',
        message: 'Municipality reset',
        level: 'info',
        data: {
          municipalityId: id,
          municipalityName: municipality.name,
          ...result,
        },
      });

      return NextResponse.json({
        success: true,
        municipality: {
          id: municipality.id,
          name: municipality.name,
          county: municipality.county,
        },
        deleted: result,
      });
    } catch (error) {
      console.error('Error resetting municipality:', error);
      
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: {
            operation: 'reset-municipality',
            municipalityId: id,
          },
        });
      }

      return NextResponse.json(
        { error: 'Failed to reset municipality' },
        { status: 500 }
      );
    }
  });
}