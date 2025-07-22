'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Calendar,
  Building,
  FileText,
  ExternalLink,
  Hash,
  Layers
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface OrdinanceListProps {
  ordinances: Array<{
    id: string;
    title: string;
    code?: string | null;
    fullText: string;
    effectiveDate?: Date | null;
    sourceUrl?: string | null;
    createdAt: Date;
    municipality: {
      id: string;
      name: string;
      county: string;
    };
    _count?: {
      chunks: number;
      opraRequests: number;
    };
  }>;
}

export function OrdinanceList({ ordinances }: OrdinanceListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOrdinances = ordinances.filter(ordinance => {
    const searchLower = searchTerm.toLowerCase();
    return (
      ordinance.title.toLowerCase().includes(searchLower) ||
      ordinance.municipality.name.toLowerCase().includes(searchLower) ||
      ordinance.municipality.county.toLowerCase().includes(searchLower) ||
      (ordinance.code && ordinance.code.toLowerCase().includes(searchLower))
    );
  });
  
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search ordinances by title, municipality, or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Ordinances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordinances.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Municipalities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(ordinances.map(o => o.municipality.id)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">OPRA Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ordinances.reduce((sum, o) => sum + (o._count?.opraRequests || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Ordinance List */}
      <div className="space-y-4">
        {filteredOrdinances.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No ordinances found matching your search.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrdinances.map((ordinance) => (
            <Card key={ordinance.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <Link 
                      href={`/ordinances/${ordinance.id}`}
                      className="hover:underline"
                    >
                      <CardTitle>{ordinance.title}</CardTitle>
                    </Link>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {ordinance.municipality.name}, {ordinance.municipality.county} County
                        </span>
                        {ordinance.code && (
                          <span className="flex items-center gap-1">
                            <Hash className="h-4 w-4" />
                            {ordinance.code}
                          </span>
                        )}
                        {ordinance.effectiveDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Effective: {new Date(ordinance.effectiveDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Added {formatDistanceToNow(new Date(ordinance.createdAt))} ago</span>
                        {ordinance._count && (
                          <>
                            <span className="flex items-center gap-1">
                              <Layers className="h-3 w-3" />
                              {ordinance._count.chunks} chunks
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {ordinance._count.opraRequests} requests
                            </span>
                          </>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/ordinances/${ordinance.id}`}>
                        View
                      </Link>
                    </Button>
                    {ordinance.sourceUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={ordinance.sourceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-3">
                  {ordinance.fullText.substring(0, 300)}...
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}