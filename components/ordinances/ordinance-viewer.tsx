'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Search, 
  ExternalLink, 
  Calendar,
  Building,
  Hash,
  Copy,
  Download,
  ChevronRight,
  Layers,
  PenTool
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OrdinanceViewerProps {
  ordinance: {
    id: string;
    title: string;
    code?: string | null;
    fullText: string;
    effectiveDate?: Date | null;
    lastUpdated?: Date | null;
    sourceUrl?: string | null;
    pdfUrl?: string | null;
    createdAt: Date;
    municipality: {
      id: string;
      name: string;
      county: string;
    };
    chunks?: Array<{
      id: string;
      content: string;
      sectionTitle?: string | null;
      chunkIndex: number;
    }>;
    opraRequests?: Array<{
      id: string;
      createdAt: Date;
    }>;
    _count?: {
      chunks: number;
      opraRequests: number;
    };
  };
  showActions?: boolean;
}

export function OrdinanceViewer({ ordinance, showActions = true }: OrdinanceViewerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('formatted');
  
  // Extract sections from full text
  const sections = useMemo(() => {
    const sectionRegex = /(?:section|article|chapter|§)\s*[\d.-]+[:\s]+[^\n]+/gi;
    const matches = ordinance.fullText.match(sectionRegex) || [];
    return matches.slice(0, 50); // Limit to 50 sections for performance
  }, [ordinance.fullText]);
  
  // Highlight search terms
  const highlightedText = useMemo(() => {
    if (!searchTerm.trim()) return ordinance.fullText;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return ordinance.fullText.replace(regex, '<mark class="bg-yellow-300">$1</mark>');
  }, [ordinance.fullText, searchTerm]);
  
  // Search within ordinance
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const regex = new RegExp(searchTerm, 'gi');
    const results: Array<{ context: string; position: number }> = [];
    let match;
    
    while ((match = regex.exec(ordinance.fullText)) !== null && results.length < 10) {
      const start = Math.max(0, match.index - 100);
      const end = Math.min(ordinance.fullText.length, match.index + 100);
      const context = ordinance.fullText.substring(start, end);
      results.push({ context, position: match.index });
    }
    
    return results;
  }, [ordinance.fullText, searchTerm]);
  
  const handleCopyText = () => {
    navigator.clipboard.writeText(ordinance.fullText);
    toast.success('Ordinance text copied to clipboard');
  };
  
  const handleCopyLink = () => {
    const url = `${window.location.origin}/ordinances/${ordinance.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{ordinance.title}</CardTitle>
              <CardDescription className="space-y-1">
                <div className="flex items-center gap-4 flex-wrap">
                  <Link 
                    href={`/municipalities?search=${ordinance.municipality.name}`}
                    className="flex items-center gap-1 hover:underline"
                  >
                    <Building className="h-4 w-4" />
                    {ordinance.municipality.name}, {ordinance.municipality.county} County
                  </Link>
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
                      <span>•</span>
                      <span>{ordinance._count.chunks} chunks</span>
                      <span>•</span>
                      <span>{ordinance._count.opraRequests} OPRA requests</span>
                    </>
                  )}
                </div>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {ordinance.sourceUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={ordinance.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Source
                  </a>
                </Button>
              )}
              {ordinance.pdfUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={ordinance.pdfUrl} download>
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </a>
                </Button>
              )}
              <Button 
                size="sm" 
                onClick={() => router.push(`/ordinances/${ordinance.id}/build-request`)}
              >
                <PenTool className="h-4 w-4 mr-2" />
                Build OPRA Request
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search within ordinance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Found {searchResults.length} matches
              </p>
              <div className="space-y-2">
                {searchResults.map((result, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                    <span dangerouslySetInnerHTML={{ 
                      __html: result.context.replace(
                        new RegExp(`(${searchTerm})`, 'gi'), 
                        '<mark class="bg-yellow-300">$1</mark>'
                      )
                    }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Content Viewer */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="formatted">
                  <FileText className="h-4 w-4 mr-2" />
                  Formatted
                </TabsTrigger>
                <TabsTrigger value="sections">
                  <Layers className="h-4 w-4 mr-2" />
                  Sections
                </TabsTrigger>
                <TabsTrigger value="raw">
                  <Hash className="h-4 w-4 mr-2" />
                  Raw Text
                </TabsTrigger>
              </TabsList>
              {showActions && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopyText}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Text
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              )}
            </div>
          </Tabs>
        </CardHeader>
        <CardContent>
          <TabsContent value="formatted" className="mt-0">
            <ScrollArea className="h-[600px] w-full rounded-md border p-4">
              <div className="prose prose-sm max-w-none">
                <div 
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                  className="whitespace-pre-wrap font-sans"
                />
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="sections" className="mt-0">
            <ScrollArea className="h-[600px] w-full rounded-md border">
              <div className="p-4 space-y-3">
                {sections.length > 0 ? (
                  sections.map((section, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                    >
                      <pre className="text-sm whitespace-pre-wrap font-sans">
                        {section}
                      </pre>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No sections detected in this ordinance
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="raw" className="mt-0">
            <ScrollArea className="h-[600px] w-full rounded-md border p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {ordinance.fullText}
              </pre>
            </ScrollArea>
          </TabsContent>
        </CardContent>
      </Card>
      
      {/* Related Items */}
      {ordinance.opraRequests && ordinance.opraRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Related OPRA Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ordinance.opraRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="text-sm">
                    OPRA Request from {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}