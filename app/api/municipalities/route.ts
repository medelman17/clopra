import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Query parameter validation
const QuerySchema = z.object({
  search: z.string().optional(),
  county: z.string().optional(),
  status: z.enum(['has_ordinance', 'no_ordinance', 'not_scraped']).optional(),
  sort: z.enum(['name', 'county', 'updatedAt']).optional().default('name'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});

type OrdinanceStatus = 'has_ordinance' | 'no_ordinance' | 'not_scraped';

interface MunicipalityWithStatus {
  id: string;
  name: string;
  county: string;
  state: string;
  websiteUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  ordinanceCount: number;
  lastOrdinanceUpdate?: Date | null;
  status: OrdinanceStatus;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = QuerySchema.parse({
      search: searchParams.get('search') || undefined,
      county: searchParams.get('county') || undefined,
      status: (searchParams.get('status') || undefined) as z.infer<typeof QuerySchema>['status'],
      sort: (searchParams.get('sort') || undefined) as z.infer<typeof QuerySchema>['sort'],
      order: (searchParams.get('order') || undefined) as z.infer<typeof QuerySchema>['order'],
    });

    // Build where clause
    const where: {
      OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; county?: { contains: string; mode: 'insensitive' } }>;
      county?: { equals: string; mode: 'insensitive' };
    } = {};
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { county: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    
    if (query.county) {
      where.county = { equals: query.county, mode: 'insensitive' };
    }

    // Fetch all municipalities with ordinance counts
    const municipalities = await prisma.municipality.findMany({
      where,
      include: {
        ordinances: {
          select: {
            id: true,
            updatedAt: true,
          },
        },
        _count: {
          select: { ordinances: true },
        },
      },
      orderBy: {
        [query.sort]: query.order,
      },
    });

    // Transform data and calculate status
    const municipalitiesWithStatus: MunicipalityWithStatus[] = municipalities.map((muni) => {
      const ordinanceCount = muni._count.ordinances;
      const lastOrdinanceUpdate = muni.ordinances.length > 0
        ? muni.ordinances.reduce((latest, ord) => 
            ord.updatedAt > latest ? ord.updatedAt : latest, 
            muni.ordinances[0].updatedAt
          )
        : null;

      let status: OrdinanceStatus;
      if (ordinanceCount > 0) {
        status = 'has_ordinance';
      } else if (muni.websiteUrl) {
        status = 'no_ordinance';
      } else {
        status = 'not_scraped';
      }

      return {
        id: muni.id,
        name: muni.name,
        county: muni.county,
        state: muni.state,
        websiteUrl: muni.websiteUrl,
        createdAt: muni.createdAt,
        updatedAt: muni.updatedAt,
        ordinanceCount,
        lastOrdinanceUpdate,
        status,
      };
    });

    // Filter by status if specified
    const filteredMunicipalities = query.status
      ? municipalitiesWithStatus.filter((m) => m.status === query.status)
      : municipalitiesWithStatus;

    // Calculate statistics across ALL municipalities (not just filtered)
    const allMunicipalities = await prisma.municipality.findMany({
      include: {
        _count: {
          select: { ordinances: true },
        },
      },
    });

    const statistics = {
      total: allMunicipalities.length,
      hasOrdinance: allMunicipalities.filter((m) => m._count.ordinances > 0).length,
      noOrdinance: allMunicipalities.filter((m) => m._count.ordinances === 0 && m.websiteUrl).length,
      notScraped: allMunicipalities.filter((m) => m._count.ordinances === 0 && !m.websiteUrl).length,
      byCounty: allMunicipalities.reduce((acc, muni) => {
        acc[muni.county] = (acc[muni.county] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      municipalities: filteredMunicipalities,
      total: filteredMunicipalities.length,
      statistics,
    });
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch municipalities' },
      { status: 500 }
    );
  }
}