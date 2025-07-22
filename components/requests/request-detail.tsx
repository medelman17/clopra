'use client';

import { format } from 'date-fns';
import Link from 'next/link';
import { 
  FileText, 
  Download, 
  Calendar, 
  Building2, 
  User, 
  Mail, 
  Phone,
  ExternalLink,
  Clock,
  Hash,
  Bookmark
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStatusBadge } from '@/lib/utils/request-status';
import type { RequestStatus } from '@/types/api';

interface RequestDetailProps {
  request: {
    id: string;
    requestNumber: string;
    status: RequestStatus;
    categories: unknown;
    customizations: unknown;
    requestText: string;
    pdfUrl: string | null;
    submittedAt: Date | null;
    responseDeadline: Date | null;
    createdAt: Date;
    updatedAt: Date;
    municipality: {
      id: string;
      name: string;
      county: string;
      state: string;
      websiteUrl: string | null;
    };
    ordinance: {
      id: string;
      title: string;
      code: string | null;
      effectiveDate: Date | null;
      sourceUrl: string | null;
    } | null;
    custodian: {
      id: string;
      name: string;
      title: string;
      email: string | null;
      phone: string | null;
      address: string | null;
    } | null;
  };
}

export function RequestDetail({ request }: RequestDetailProps) {
  const categories = Array.isArray(request.categories) ? request.categories : [];
  const customizations = request.customizations as Record<string, unknown> || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{request.municipality.name}</h1>
          <p className="text-muted-foreground mt-1">OPRA Request #{request.requestNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(request.status)}
          {request.pdfUrl && (
            <Button className="gap-2" asChild>
              <a href={request.pdfUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Key Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{format(new Date(request.createdAt), 'PPP')}</p>
            </div>
            {request.submittedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium">{format(new Date(request.submittedAt), 'PPP')}</p>
              </div>
            )}
            {request.responseDeadline && (
              <div>
                <p className="text-sm text-muted-foreground">Response Due</p>
                <p className="font-medium">{format(new Date(request.responseDeadline), 'PPP')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Municipality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{request.municipality.name}</p>
              <p className="text-sm text-muted-foreground">{request.municipality.county} County, {request.municipality.state}</p>
            </div>
            {request.municipality.websiteUrl && (
              <a 
                href={request.municipality.websiteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                Visit Website
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custodian Information */}
      {request.custodian && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Records Custodian
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">{request.custodian.name}</p>
              <p className="text-sm text-muted-foreground">{request.custodian.title}</p>
            </div>
            <div className="space-y-2">
              {request.custodian.email && (
                <a 
                  href={`mailto:${request.custodian.email}`}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {request.custodian.email}
                </a>
              )}
              {request.custodian.phone && (
                <p className="inline-flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  {request.custodian.phone}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ordinance Information */}
      {request.ordinance && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Based on Ordinance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{request.ordinance.title}</p>
              {request.ordinance.code && (
                <p className="text-sm text-muted-foreground">Code: {request.ordinance.code}</p>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              {request.ordinance.effectiveDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Effective {format(new Date(request.ordinance.effectiveDate), 'PP')}
                </span>
              )}
              <Link 
                href={`/ordinances/${request.ordinance.id}`}
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                View Full Ordinance
                <ExternalLink className="h-3 w-3" />
              </Link>
              {request.ordinance.sourceUrl && (
                <a 
                  href={request.ordinance.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  View Source
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Requested Categories
          </CardTitle>
          <CardDescription>
            {categories.length} categories of records requested
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((category, idx) => (
              <Badge key={idx} variant="secondary">
                {String(category)}
              </Badge>
            ))}
          </div>
          {Object.keys(customizations).length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Ordinance-Specific Customizations:</p>
              <div className="space-y-1">
                {Object.entries(customizations).map(([key, value]) => (
                  <p key={key} className="text-sm">
                    <span className="font-medium">{key}:</span> {value !== null && value !== undefined ? String(value) : ''}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Request Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Full Request Text
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-6">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {request.requestText}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}