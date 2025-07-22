'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [municipalityName, setMunicipalityName] = useState('Atlantic Highlands');
  const [county, setCounty] = useState('Monmouth');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

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

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (ordinanceId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ordinances/${ordinanceId}/process`, {
        method: 'POST',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process ordinance');
      }

      alert(`Ordinance processed! Created ${data.chunksCreated} chunks.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
                        href={result.ordinance.sourceUrl} 
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
                  onClick={() => handleProcess(result.ordinance.id)}
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
        </div>
      )}
    </div>
  );
}