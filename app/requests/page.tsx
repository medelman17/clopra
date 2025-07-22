import { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { prisma as db } from '@/lib/db/prisma';
import { RequestList } from '@/components/requests/request-list';

export const metadata: Metadata = {
  title: 'OPRA Requests | CLOPRA',
  description: 'View and manage your generated OPRA requests',
};

export default async function RequestsPage() {
  // Fetch OPRA requests with related municipality and ordinance data
  const requests = await db.opraRequest.findMany({
    include: {
      municipality: true,
      ordinance: {
        select: {
          title: true,
          effectiveDate: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch municipalities for filter
  const municipalities = await db.municipality.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  if (requests.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">OPRA Requests</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your generated OPRA requests
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start by searching for a municipality and generating an OPRA request
            </p>
            <Button asChild>
              <a href="/municipalities">Browse Municipalities</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">OPRA Requests</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your generated OPRA requests
        </p>
      </div>

      <RequestList initialRequests={requests} municipalities={municipalities} />
    </div>
  );
}