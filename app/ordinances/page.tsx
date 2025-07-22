import { Suspense } from 'react';
import { prisma } from '@/lib/db/prisma';
import { OrdinanceList } from '@/components/ordinances/ordinance-list';
import { OrdinanceListSkeleton } from '@/components/ui/loading-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

async function getOrdinances() {
  const ordinances = await prisma.ordinance.findMany({
    include: {
      municipality: true,
      _count: {
        select: {
          chunks: true,
          opraRequests: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return ordinances;
}

export default async function OrdinancesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Rent Control Ordinances</h1>
        <p className="text-muted-foreground mt-2">
          Browse and search through scraped rent control ordinances from New Jersey municipalities
        </p>
      </div>

      <Suspense fallback={<OrdinanceListSkeleton />}>
        <OrdinanceListContent />
      </Suspense>
    </div>
  );
}

async function OrdinanceListContent() {
  const ordinances = await getOrdinances();

  if (ordinances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Ordinances Found</CardTitle>
          <CardDescription>
            No rent control ordinances have been scraped yet. Visit the municipalities page to scrape ordinances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a 
            href="/municipalities" 
            className="text-primary hover:underline"
          >
            Go to Municipalities →
          </a>
        </CardContent>
      </Card>
    );
  }

  return <OrdinanceList ordinances={ordinances} />;
}