'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MultiStepProgress, type ProcessStep } from '@/components/ui/progress-indicator';
import { OrdinancePreview } from '@/components/debug/ordinance-preview';
import type { ScrapeResult } from '@/types/api';

function AppContent() {
  const searchParams = useSearchParams();
  const [municipalityName, setMunicipalityName] = useState('');
  const [county, setCounty] = useState('');
  const [municipalityId, setMunicipalityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opraRequest, setOpraRequest] = useState<{
    id: string;
    pdfUrl: string;
    requestText: string;
  } | null>(null);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);

  useEffect(() => {
    const municipalityIdParam = searchParams.get('municipalityId');
    
    if (municipalityIdParam) {
      setMunicipalityId(municipalityIdParam);
      // Fetch municipality details by ID
      fetchMunicipalityDetails(municipalityIdParam);
    }
  }, [searchParams]);

  const fetchMunicipalityDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/municipalities/${id}`);
      if (!response.ok) throw new Error('Failed to fetch municipality');
      
      const data = await response.json();
      setMunicipalityName(data.name);
      setCounty(data.county);
    } catch (err) {
      console.error('Error fetching municipality:', err);
      toast.error('Failed to load municipality details');
    }
  };

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setOpraRequest(null);
    setCurrentOperation('scraping');

    // Initialize scraping steps
    const scrapingSteps: ProcessStep[] = [
      {
        id: 'search',
        label: 'Searching municipal websites',
        description: 'Finding rent control ordinance pages',
        status: 'in-progress',
        progress: 0,
      },
      {
        id: 'extract',
        label: 'Extracting ordinance text',
        description: 'Parsing and cleaning content',
        status: 'pending',
      },
      {
        id: 'save',
        label: 'Saving to database',
        description: 'Storing ordinance and metadata',
        status: 'pending',
      }
    ];
    setProcessSteps(scrapingSteps);

    const toastId = toast.scraping.start(municipalityName);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProcessSteps(prev => {
        const updated = [...prev];
        const currentStep = updated.find(s => s.status === 'in-progress');
        if (currentStep && currentStep.progress !== undefined) {
          currentStep.progress = Math.min(currentStep.progress + 20, 90);
        }
        return updated;
      });
    }, 500);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          municipalityName, 
          county,
          municipalityId // Include the ID for validation
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape ordinance');
      }

      // Update steps to show completion
      clearInterval(progressInterval);
      setProcessSteps(prev => prev.map(step => ({ ...step, status: 'completed', progress: 100 })));

      toast.dismiss(toastId);
      toast.scraping.success(municipalityName);
      setResult(data);
    } catch (err) {
      clearInterval(progressInterval);
      setProcessSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx === 0 ? 'error' : step.status,
      })));
      
      toast.dismiss(toastId);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.scraping.error(municipalityName, errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setTimeout(() => setCurrentOperation(null), 2000);
    }
  };

  const generateOpraRequest = async (ordinanceId: string) => {
    setLoading(true);
    setCurrentOperation('generating');
    
    // Initialize generation steps
    const generationSteps: ProcessStep[] = [
      {
        id: 'analyze',
        label: 'Analyzing ordinance provisions',
        description: 'Identifying relevant sections',
        status: 'in-progress',
        progress: 0,
      },
      {
        id: 'match',
        label: 'Matching OPRA categories',
        description: 'Determining required records',
        status: 'pending',
      },
      {
        id: 'generate',
        label: 'Generating request',
        description: 'Creating tailored OPRA request',
        status: 'pending',
      },
      {
        id: 'pdf',
        label: 'Creating PDF',
        description: 'Formatting for submission',
        status: 'pending',
      }
    ];
    setProcessSteps(generationSteps);
    
    toast.opra.analyzing();
    
    // Simulate progress
    let currentStepIdx = 0;
    const progressInterval = setInterval(() => {
      setProcessSteps(prev => {
        const updated = [...prev];
        if (currentStepIdx < updated.length && updated[currentStepIdx] && updated[currentStepIdx].progress !== undefined) {
          updated[currentStepIdx].progress = Math.min(updated[currentStepIdx].progress! + 25, 90);
        }
        return updated;
      });
    }, 300);
    
    try {
      // First analyze the ordinance
      const analyzeResponse = await fetch(`/api/ordinances/${ordinanceId}/analyze`, {
        method: 'POST',
      });

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze ordinance');
      }

      // Move to matching step
      clearInterval(progressInterval);
      setProcessSteps(prev => {
        const updated = [...prev];
        updated[0] = { ...updated[0], status: 'completed', progress: 100 };
        updated[1] = { ...updated[1], status: 'in-progress', progress: 0 };
        return updated;
      });
      currentStepIdx = 1;

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

      // Complete all steps
      setProcessSteps(prev => prev.map(step => ({ ...step, status: 'completed', progress: 100 })));

      setOpraRequest({
        id: data.id,
        pdfUrl: data.pdfUrl,
        requestText: data.requestText,
      });

      toast.dismiss();
      toast.opra.success();
    } catch (err) {
      clearInterval(progressInterval);
      setProcessSteps(prev => {
        const updated = [...prev];
        const currentIdx = updated.findIndex(s => s.status === 'in-progress');
        if (currentIdx !== -1) {
          updated[currentIdx] = { ...updated[currentIdx], status: 'error' };
        }
        return updated;
      });
      
      toast.dismiss();
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.opra.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setTimeout(() => setCurrentOperation(null), 2000);
    }
  };

  const handleProcess = async (ordinanceId: string) => {
    setLoading(true);
    setCurrentOperation('processing');
    
    // Initialize processing steps
    const processingSteps: ProcessStep[] = [
      {
        id: 'chunk',
        label: 'Chunking ordinance text',
        description: 'Breaking down into searchable sections',
        status: 'in-progress',
        progress: 0,
      },
      {
        id: 'embed',
        label: 'Generating embeddings',
        description: 'Creating vector representations',
        status: 'pending',
      },
      {
        id: 'index',
        label: 'Indexing in database',
        description: 'Enabling semantic search',
        status: 'pending',
      }
    ];
    setProcessSteps(processingSteps);
    
    const toastId = toast.processing.start();
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProcessSteps(prev => {
        const updated = [...prev];
        const currentIdx = updated.findIndex(s => s.status === 'in-progress');
        if (currentIdx !== -1 && updated[currentIdx].progress !== undefined) {
          updated[currentIdx].progress = Math.min(updated[currentIdx].progress + 15, 90);
          
          // Move to next step
          if (updated[currentIdx].progress >= 90 && currentIdx < updated.length - 1) {
            updated[currentIdx] = { ...updated[currentIdx], status: 'completed', progress: 100 };
            updated[currentIdx + 1] = { ...updated[currentIdx + 1], status: 'in-progress', progress: 0 };
          }
        }
        return updated;
      });
    }, 400);
    
    try {
      const response = await fetch(`/api/ordinances/${ordinanceId}/process`, {
        method: 'POST',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process ordinance');
      }

      clearInterval(progressInterval);
      setProcessSteps(prev => prev.map(step => ({ ...step, status: 'completed', progress: 100 })));

      toast.dismiss(toastId);
      toast.processing.success(data.chunksCreated);
      
      // Auto-generate OPRA request after processing
      await generateOpraRequest(ordinanceId);
    } catch (err) {
      clearInterval(progressInterval);
      setProcessSteps(prev => {
        const updated = [...prev];
        const currentIdx = updated.findIndex(s => s.status === 'in-progress');
        if (currentIdx !== -1) {
          updated[currentIdx] = { ...updated[currentIdx], status: 'error' };
        }
        return updated;
      });
      
      toast.dismiss(toastId);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.processing.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      if (currentOperation === 'processing') {
        setTimeout(() => setCurrentOperation(null), 2000);
      }
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
              {loading && currentOperation === 'scraping' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search for Ordinance'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {loading && currentOperation && processSteps.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">
              {currentOperation === 'scraping' && 'Searching for Ordinance'}
              {currentOperation === 'processing' && 'Processing Ordinance'}
              {currentOperation === 'generating' && 'Generating OPRA Request'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MultiStepProgress steps={processSteps} showProgress={true} />
          </CardContent>
        </Card>
      )}

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
            <OrdinancePreview 
              ordinance={result.ordinance}
              onAccept={() => handleProcess(result.ordinance!.id)}
              onReject={() => {
                setResult(null);
                setError('Please try searching with more specific terms or check the municipality website directly.');
              }}
              showActions={!loading && !opraRequest}
            />
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