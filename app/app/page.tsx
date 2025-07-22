'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { ScrapeResult } from '@/types/api';

function AppContent() {
  const searchParams = useSearchParams();
  const [municipalityName, setMunicipalityName] = useState('');
  const [county, setCounty] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opraRequest, setOpraRequest] = useState<{
    id: string;
    pdfUrl: string;
    requestText: string;
  } | null>(null);

  useEffect(() => {
    const municipalityParam = searchParams.get('municipality');
    const countyParam = searchParams.get('county');
    const municipalityIdParam = searchParams.get('municipalityId');
    
    if (municipalityParam) setMunicipalityName(municipalityParam);
    if (countyParam) setCounty(countyParam);
    
    // If we have a municipality ID, we could fetch its details
    if (municipalityIdParam) {
      // TODO: Fetch municipality details by ID
    }
  }, [searchParams]);

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const toastId = toast.scraping.start(municipalityName);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ municipalityName, county }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape ordinance');
      }

      toast.dismiss(toastId);
      toast.scraping.success(municipalityName);
      setResult(data);
    } catch (err) {
      toast.dismiss(toastId);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.scraping.error(municipalityName, errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateOpraRequest = async (ordinanceId: string) => {
    setLoading(true);
    toast.opra.analyzing();
    
    try {
      // First analyze the ordinance
      const analyzeResponse = await fetch(`/api/ordinances/${ordinanceId}/analyze`, {
        method: 'POST',
      });

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze ordinance');
      }

      // Then generate the OPRA request with PDF
      toast.dismiss();
      toast.opra.generating();
      
      const response = await fetch('/api/opra-requests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ordinanceId,
          includeAllCategories: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate OPRA request');
      }

      setOpraRequest({
        id: data.id,
        pdfUrl: data.pdfUrl,
        requestText: data.requestText,
      });

      toast.dismiss();
      toast.opra.success();
    } catch (err) {
      toast.dismiss();
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.opra.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (ordinanceId: string) => {
    setLoading(true);
    const toastId = toast.processing.start();
    
    try {
      const response = await fetch(`/api/ordinances/${ordinanceId}/process`, {
        method: 'POST',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process ordinance');
      }

      toast.dismiss(toastId);
      toast.processing.success(data.chunksCreated);
      
      // Auto-generate OPRA request after processing
      await generateOpraRequest(ordinanceId);
    } catch (err) {
      toast.dismiss(toastId);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.processing.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">NJ OPRA Request Generator</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Scrape Municipality Rent Control Ordinance</CardTitle>
          <CardDescription>
            Enter a New Jersey municipality name to search for and extract their rent control ordinance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Municipality Name</label>
              <Input
                placeholder="e.g., Atlantic Highlands"
                value={municipalityName}
                onChange={(e) => setMunicipalityName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">County</label>
              <Input
                placeholder="e.g., Monmouth"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleScrape} 
              disabled={loading || !municipalityName}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Searching...' : 'Search for Ordinance'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Municipality Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-2">
                <dt className="font-medium">Name:</dt>
                <dd>{result.municipality.name}</dd>
                <dt className="font-medium">County:</dt>
                <dd>{result.municipality.county}</dd>
                <dt className="font-medium">State:</dt>
                <dd>{result.municipality.state}</dd>
              </dl>
            </CardContent>
          </Card>

          {result.ordinance && (
            <Card>
              <CardHeader>
                <CardTitle>Ordinance Found</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="font-medium">Title:</dt>
                    <dd>{result.ordinance.title}</dd>
                  </div>
                  {result.ordinance.code && (
                    <div>
                      <dt className="font-medium">Code:</dt>
                      <dd>{result.ordinance.code}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="font-medium">Source:</dt>
                    <dd>
                      <a 
                        href={result.ordinance.sourceUrl || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {result.ordinance.sourceUrl}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Content Preview:</dt>
                    <dd className="mt-2 p-4 bg-gray-50 rounded text-sm">
                      {result.ordinance.fullText.substring(0, 500)}...
                    </dd>
                  </div>
                </dl>
                <Button 
                  onClick={() => handleProcess(result.ordinance!.id)}
                  className="mt-4"
                  variant="secondary"
                >
                  Process Ordinance (Chunk & Embed)
                </Button>
              </CardContent>
            </Card>
          )}

          {result.custodian && (
            <Card>
              <CardHeader>
                <CardTitle>OPRA Custodian Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-2">
                  <dt className="font-medium">Name:</dt>
                  <dd>{result.custodian.name}</dd>
                  <dt className="font-medium">Title:</dt>
                  <dd>{result.custodian.title}</dd>
                  {result.custodian.email && (
                    <>
                      <dt className="font-medium">Email:</dt>
                      <dd>{result.custodian.email}</dd>
                    </>
                  )}
                  {result.custodian.phone && (
                    <>
                      <dt className="font-medium">Phone:</dt>
                      <dd>{result.custodian.phone}</dd>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {opraRequest && (
            <Card data-opra-result>
              <CardHeader>
                <CardTitle>Generated OPRA Request</CardTitle>
                <CardDescription>
                  Your OPRA request has been generated and is ready to download
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => window.open(opraRequest.pdfUrl, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(opraRequest.requestText);
                        toast.file.copied();
                      }}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Copy Text
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Preview:</h3>
                    <div className="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {opraRequest.requestText.substring(0, 500)}...
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    }>
      <AppContent />
    </Suspense>
  );
}