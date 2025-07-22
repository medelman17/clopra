'use client';

import { useState } from 'react';
import { formatDistance } from 'date-fns';
import { FileText, Download, Calendar, Building2, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStatusBadge } from '@/lib/utils/request-status';
import type { RequestStatus } from '@/types/api';
import Link from 'next/link';

interface Municipality {
  id: string;
  name: string;
  county: string;
}

interface Ordinance {
  title: string;
  effectiveDate: Date | null;
}

interface OpraRequest {
  id: string;
  requestNumber: string;
  status: RequestStatus;
  categories: unknown;
  pdfUrl: string | null;
  createdAt: Date;
  municipality: Municipality;
  ordinance: Ordinance | null;
}

interface RequestListProps {
  initialRequests: OpraRequest[];
  municipalities: { id: string; name: string }[];
}


export function RequestList({ initialRequests, municipalities }: RequestListProps) {
  const requests = initialRequests;
  const [filterMunicipality, setFilterMunicipality] = useState('');
  const [filterStatus, setFilterStatus] = useState<RequestStatus | ''>('');
  const [sortBy, setSortBy] = useState<'date' | 'municipality' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter requests
  const filteredRequests = requests.filter(request => {
    if (filterMunicipality && request.municipality.id !== filterMunicipality) {
      return false;
    }
    if (filterStatus && request.status !== filterStatus) {
      return false;
    }
    return true;
  });

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'municipality':
        comparison = a.municipality.name.localeCompare(b.municipality.name);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters & Sorting
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={filterMunicipality} onValueChange={setFilterMunicipality}>
            <SelectTrigger>
              <SelectValue placeholder="All Municipalities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Municipalities</SelectItem>
              {municipalities.map(muni => (
                <SelectItem key={muni.id} value={muni.id}>
                  {muni.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as RequestStatus | '')}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="SUBMITTED">Sent</SelectItem>
              <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
              <SelectItem value="FULFILLED">Fulfilled</SelectItem>
              <SelectItem value="DENIED">Denied</SelectItem>
              <SelectItem value="APPEALED">Appealed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'municipality' | 'status')}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="municipality">Municipality</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
            <SelectTrigger>
              <SelectValue placeholder="Order..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedRequests.length} of {requests.length} requests
      </div>

      {/* Request list */}
      <div className="grid gap-4">
        {sortedRequests.map((request) => (
          <Link key={request.id} href={`/requests/${request.id}`} className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                  {getStatusBadge(request.status)}
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
                  <span className="font-medium">Request #:</span> {request.requestNumber}
                </div>
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
          </Link>
        ))}
      </div>

      {sortedRequests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matching requests</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your filters to see more results
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}