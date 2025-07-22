'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Search, 
  CheckCircle, 
  XCircle,
  Brain,
  FileText,
  ChevronRight
} from 'lucide-react';

interface AgentResult {
  success: boolean;
  ordinance?: {
    title: string;
    content: string;
    url: string;
    confidence: 'high' | 'medium' | 'low';
    sections: Array<{ number: string; title: string }>;
  };
  reasoning?: string[];
  searches?: Array<{ query: string; resultsFound: number }>;
  agentReasoning?: string[];
}

export function AgentTest() {
  const [municipality, setMunicipality] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testAgent = async (useFullAgent: boolean) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/scrape/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          municipalityName: municipality,
          useFullAgent,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Agent failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>;
      case 'low':
        return <Badge className="bg-red-100 text-red-800">Low Confidence</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Agent-Based Ordinance Scraper
          </CardTitle>
          <CardDescription>
            Test the intelligent agent that searches, validates, and extracts ordinances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Municipality name (e.g., Jersey City)"
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                disabled={loading}
              />
              <Button
                onClick={() => testAgent(false)}
                disabled={loading || !municipality}
                variant="outline"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Quick Search
              </Button>
              <Button
                onClick={() => testAgent(true)}
                disabled={loading || !municipality}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                Full Agent
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              <strong>Quick Search:</strong> Uses enhanced scraper with validation<br />
              <strong>Full Agent:</strong> Multi-step reasoning with search refinement
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  {result.success ? 'Ordinance Found' : 'No Ordinance Found'}
                </CardTitle>
                {result.ordinance && (
                  <CardDescription>{result.ordinance.title}</CardDescription>
                )}
              </div>
              {result.ordinance && getConfidenceBadge(result.ordinance.confidence)}
            </div>
          </CardHeader>
          <CardContent>
            {result.ordinance ? (
              <Tabs defaultValue="content">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="sections">Sections</TabsTrigger>
                  <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
                  <TabsTrigger value="searches">Searches</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-2">
                  <div className="text-sm">
                    <strong>Source:</strong>{' '}
                    <a href={result.ordinance.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {result.ordinance.url}
                    </a>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {result.ordinance.content.substring(0, 2000)}...
                    </pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="sections" className="space-y-2">
                  {result.ordinance.sections.length > 0 ? (
                    result.ordinance.sections.map((section, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                        <Badge variant="outline">{section.number}</Badge>
                        <span className="text-sm">{section.title}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No sections extracted</p>
                  )}
                </TabsContent>
                
                <TabsContent value="reasoning" className="space-y-2">
                  {(result.reasoning || result.agentReasoning || []).map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <p className="text-sm">{reason}</p>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="searches" className="space-y-2">
                  {result.searches?.map((search, idx) => (
                    <div key={idx} className="p-2 bg-muted/50 rounded">
                      <p className="text-sm font-medium">{search.query}</p>
                      <p className="text-xs text-muted-foreground">Found {search.resultsFound} results</p>
                    </div>
                  )) || <p className="text-muted-foreground">No search history available</p>}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No ordinance could be found for this municipality</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}