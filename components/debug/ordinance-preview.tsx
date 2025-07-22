'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  FileText,
  Code,
  Search
} from 'lucide-react';

interface OrdinanceValidation {
  hasRentControl: boolean;
  hasLegalSections: boolean;
  hasDefinitions: boolean;
  contentLength: number;
  suspiciousContent: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface OrdinancePreviewProps {
  ordinance: {
    title: string;
    code?: string | null;
    fullText: string;
    sourceUrl?: string | null;
  };
  onAccept?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}

function validateOrdinanceContent(text: string): OrdinanceValidation {
  const lowerText = text.toLowerCase();
  
  // Check for rent control keywords
  const rentControlKeywords = ['rent control', 'rent stabilization', 'rent regulation', 'rental housing'];
  const hasRentControl = rentControlKeywords.some(keyword => lowerText.includes(keyword));
  
  // Check for legal document structure
  const legalIndicators = ['section', 'article', 'chapter', '§', 'subsection', 'paragraph'];
  const hasLegalSections = legalIndicators.some(indicator => lowerText.includes(indicator));
  
  // Check for definitions section (common in ordinances)
  const hasDefinitions = lowerText.includes('definition') || lowerText.includes('as used in this');
  
  // Check for suspicious content (might be search results or navigation)
  const suspiciousPatterns = [
    'search results',
    'no results found',
    'click here',
    'navigation',
    'menu',
    'home page',
    'cookie policy',
    'privacy policy',
    '404',
    'page not found'
  ];
  const suspiciousContent = suspiciousPatterns.filter(pattern => lowerText.includes(pattern));
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (hasRentControl && hasLegalSections && text.length > 1000) {
    confidence = 'high';
  } else if ((hasRentControl || hasLegalSections) && text.length > 500) {
    confidence = 'medium';
  }
  
  return {
    hasRentControl,
    hasLegalSections,
    hasDefinitions,
    contentLength: text.length,
    suspiciousContent,
    confidence
  };
}

export function OrdinancePreview({ 
  ordinance, 
  onAccept, 
  onReject,
  showActions = true 
}: OrdinancePreviewProps) {
  const [activeTab, setActiveTab] = useState('preview');
  const validation = validateOrdinanceContent(ordinance.fullText);
  
  const getConfidenceBadge = () => {
    switch (validation.confidence) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>;
      case 'low':
        return <Badge className="bg-red-100 text-red-800">Low Confidence</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{ordinance.title}</CardTitle>
            <CardDescription className="mt-2 space-y-1">
              {ordinance.code && <div>Code: {ordinance.code}</div>}
              <div className="flex items-center gap-2">
                <span>Source:</span>
                {ordinance.sourceUrl && (
                  <a 
                    href={ordinance.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                  >
                    {new URL(ordinance.sourceUrl).hostname}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </CardDescription>
          </div>
          {getConfidenceBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Validation Results */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Content Validation</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm">
              {validation.hasRentControl ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span>Contains rent control terms</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {validation.hasLegalSections ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span>Has legal document structure</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {validation.contentLength > 1000 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <span>{validation.contentLength} characters</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {validation.hasDefinitions ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <span>Contains definitions</span>
            </div>
          </div>
        </div>
        
        {validation.suspiciousContent.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This content may not be an ordinance. Found: {validation.suspiciousContent.join(', ')}
            </AlertDescription>
          </Alert>
        )}
        
        {validation.confidence === 'low' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Low Confidence Result</AlertTitle>
            <AlertDescription>
              The scraped content doesn&apos;t appear to be a rent control ordinance. It might be:
              <ul className="list-disc list-inside mt-2">
                <li>A search results page</li>
                <li>A summary or excerpt</li>
                <li>Navigation/menu content</li>
                <li>The wrong document entirely</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Content Preview Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">
              <FileText className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="raw">
              <Code className="h-4 w-4 mr-2" />
              Raw Text
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" />
              Key Sections
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="mt-4">
            <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {ordinance.fullText.substring(0, 2000)}
                  {ordinance.fullText.length > 2000 && '\n\n... (truncated for preview)'}
                </pre>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="raw" className="mt-4">
            <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs font-mono">
                {ordinance.fullText}
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="search" className="mt-4">
            <div className="space-y-4">
              {ordinance.fullText.match(/(?:section|article|§)\s*[\d.-]+[:\s]+[^\n]+/gi)?.slice(0, 10).map((section, idx) => (
                <div key={idx} className="bg-muted/50 rounded p-3">
                  <pre className="text-sm whitespace-pre-wrap">{section}</pre>
                </div>
              )) || (
                <p className="text-muted-foreground">No legal sections found</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Action Buttons */}
        {showActions && (
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onReject}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              This isn&apos;t right
            </Button>
            <Button 
              onClick={onAccept}
              disabled={validation.confidence === 'low'}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Process this ordinance
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}