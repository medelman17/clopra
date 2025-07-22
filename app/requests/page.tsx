import { Metadata } from 'next';
import { FileText, Download, Calendar, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma as db } from '@/lib/db/prisma';
import { formatDistance } from 'date-fns';

export const metadata: Metadata = {
  title: 'OPRA Requests | CLOPRA',
  description: 'View and manage your generated OPRA requests',
};

// Define request status type
type RequestStatus = 'draft' | 'sent' | 'responded' | 'closed';

// Helper function to get status badge variant
function getStatusBadge(status: RequestStatus | null) {
  switch (status) {
    case 'draft':
      return <Badge variant="secondary">Draft</Badge>;
    case 'sent':
      return <Badge variant="default">Sent</Badge>;
    case 'responded':
      return <Badge variant="outline" className="border-green-600 text-green-700">Responded</Badge>;
    case 'closed':
      return <Badge variant="secondary">Closed</Badge>;
    default:
      return <Badge variant="secondary">Draft</Badge>;
  }
}

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

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">
                    {request.municipality.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {request.municipality.county} County
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDistance(new Date(request.createdAt), new Date(), { addSuffix: true })}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(request.status as RequestStatus | null)}
                  {request.pdfUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      asChild
                    >
                      <a href={request.pdfUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                        Download PDF
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Categories Requested:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.isArray(request.categories) && request.categories.map((category, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {String(category)}
                      </Badge>
                    ))}
                  </div>
                </div>
                {request.ordinance && (
                  <div className="text-sm text-muted-foreground">
                    Based on: {request.ordinance.title || 'Rent Control Ordinance'}
                    {request.ordinance.effectiveDate && (
                      <span> (Effective {new Date(request.ordinance.effectiveDate).toLocaleDateString()})</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}