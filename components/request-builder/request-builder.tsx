'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Save, 
  FileText, 
  ArrowLeft,
  Loader2,
  Eye,
  Edit,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RequestEditor } from './request-editor';
import { RequestPreview } from './request-preview';
import { CategorySelector } from './category-selector';
import type { Municipality, Ordinance, OpraRequest, Custodian } from '@prisma/client';

interface RequestBuilderProps {
  ordinance: Ordinance & {
    municipality: Municipality & {
      custodians: Custodian[];
    };
    chunks?: Array<{
      id: string;
      content: string;
      sectionTitle?: string | null;
      chunkIndex: number;
    }>;
  };
  municipality: Municipality & {
    custodians: Custodian[];
  };
  existingDraft?: OpraRequest | null;
}

interface RequestSection {
  id: string;
  title: string;
  content: string;
  category: string;
  isCustom?: boolean;
}

const defaultCategories = [
  { id: 'basic-info', name: 'Basic Information', description: 'General ordinance details' },
  { id: 'tenant-protections', name: 'Tenant Protections', description: 'Tenant rights and protections' },
  { id: 'rent-increases', name: 'Rent Increases', description: 'Allowable rent increase policies' },
  { id: 'exemptions', name: 'Exemptions', description: 'Properties exempt from rent control' },
  { id: 'enforcement', name: 'Enforcement', description: 'Enforcement mechanisms and penalties' },
  { id: 'registration', name: 'Registration', description: 'Registration requirements' },
  { id: 'board-info', name: 'Rent Board Information', description: 'Rent control board details' },
  { id: 'forms', name: 'Forms & Applications', description: 'Required forms and applications' },
  { id: 'fees', name: 'Fees & Costs', description: 'Associated fees and costs' },
  { id: 'appeals', name: 'Appeals Process', description: 'Appeal procedures' },
];

function parseRequestIntoSections(
  requestText: string, 
  categories: Array<{
    id: string;
    name: string;
    questions?: string;
  }>,
  custodianName?: string
): RequestSection[] {
  // This is a simplified parser - you might want to make this more sophisticated
  const sections: RequestSection[] = [];
  
  // Add header section
  sections.push({
    id: 'header',
    title: 'Request Header',
    content: `Dear ${custodianName || 'Municipal Clerk'},\n\nPursuant to the Open Public Records Act (OPRA), N.J.S.A. 47:1A-1 et seq., I am requesting access to the following public records related to the rent control ordinance:`,
    category: 'header',
  });

  // Add category sections
  categories.forEach((category) => {
    sections.push({
      id: category.id,
      title: category.name,
      content: category.questions || `Please provide all documents related to ${category.name.toLowerCase()}.`,
      category: category.id,
    });
  });

  // Add footer section
  sections.push({
    id: 'footer',
    title: 'Request Footer',
    content: 'I understand that there may be a charge for copies and I am willing to pay reasonable fees for this request. Please notify me if the cost will exceed $25.00.\n\nThank you for your assistance with this request.',
    category: 'footer',
  });

  return sections;
}

export function RequestBuilder({ ordinance, municipality, existingDraft }: RequestBuilderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sections, setSections] = useState<RequestSection[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('edit');
  const [draftId, setDraftId] = useState(existingDraft?.id || null);
  const ordinanceId = ordinance.id;

  const generateInitialRequest = useCallback(async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/opra-requests/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ordinanceId,
          includeAllCategories: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate preview');

      const data = await response.json();
      
      // Parse the generated request into sections
      const parsedSections = parseRequestIntoSections(
        data.requestText, 
        data.categories,
        municipality.custodians[0]?.name
      );
      setSections(parsedSections);
      setSelectedCategories(data.categories.map((c: { id: string }) => c.id));
    } catch (error) {
      console.error('Error generating initial request:', error);
      toast.error('Failed to generate initial request');
    } finally {
      setGenerating(false);
    }
  }, [ordinanceId, municipality]);

  // Initialize from existing draft or generate new
  useEffect(() => {
    if (existingDraft) {
      // Load from existing draft
      const draftData = existingDraft.customizations as {
        sections?: RequestSection[];
        selectedCategories?: string[];
      };
      setSections(draftData?.sections || []);
      setSelectedCategories(draftData?.selectedCategories || []);
    } else {
      // Generate initial request
      generateInitialRequest();
    }
  }, [existingDraft, generateInitialRequest]);

  const handleSectionUpdate = (sectionId: string, content: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, content } : section
    ));
  };

  const handleAddSection = () => {
    const newSection: RequestSection = {
      id: `custom-${Date.now()}`,
      title: 'Custom Section',
      content: '',
      category: 'custom',
      isCustom: true,
    };
    setSections(prev => [...prev, newSection]);
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const endpoint = draftId 
        ? `/api/opra-requests/${draftId}` 
        : '/api/opra-requests/draft';
      
      const method = draftId ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ordinanceId: ordinance.id,
          municipalityId: municipality.id,
          custodianId: municipality.custodians[0]?.id,
          customizations: {
            sections,
            selectedCategories,
          },
          requestText: buildRequestText(),
        }),
      });

      if (!response.ok) throw new Error('Failed to save draft');

      const data = await response.json();
      setDraftId(data.id);
      toast.success('Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    setLoading(true);
    try {
      // First save the draft
      await handleSaveDraft();

      // Then generate the PDF
      const response = await fetch(`/api/opra-requests/${draftId}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestText: buildRequestText(),
        }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const data = await response.json();
      
      toast.success('PDF generated successfully');
      
      // Redirect to the request detail page
      router.push(`/requests/${data.id}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const buildRequestText = useCallback(() => {
    return sections
      .filter(section => 
        section.category === 'header' || 
        section.category === 'footer' || 
        selectedCategories.includes(section.category) ||
        section.isCustom
      )
      .map(section => section.content)
      .join('\n\n');
  }, [sections, selectedCategories]);

  const requestText = buildRequestText();

  if (generating) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing ordinance and generating request...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/ordinances/${ordinance.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ordinance
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Build OPRA Request</h1>
            <p className="text-muted-foreground">
              Customize your request for {municipality.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button
            onClick={handleGeneratePDF}
            disabled={loading || sections.length === 0}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Generate PDF
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <Card className="h-[800px] overflow-hidden">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Request
                </TabsTrigger>
                <TabsTrigger value="categories">
                  <Plus className="h-4 w-4 mr-2" />
                  Categories
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="h-[calc(100%-5rem)] overflow-y-auto">
            <TabsContent value="edit" className="mt-0">
              <RequestEditor
                sections={sections}
                onUpdateSection={handleSectionUpdate}
                onAddSection={handleAddSection}
                onDeleteSection={handleDeleteSection}
                selectedCategories={selectedCategories}
              />
            </TabsContent>
            <TabsContent value="categories" className="mt-0">
              <CategorySelector
                categories={defaultCategories}
                selectedCategories={selectedCategories}
                onToggleCategory={(categoryId) => {
                  setSelectedCategories(prev =>
                    prev.includes(categoryId)
                      ? prev.filter(id => id !== categoryId)
                      : [...prev, categoryId]
                  );
                }}
              />
            </TabsContent>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card className="h-[800px] overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview
            </CardTitle>
            <CardDescription>
              See how your request will appear
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-5rem)] overflow-y-auto">
            <RequestPreview
              requestText={requestText}
              municipality={municipality}
              custodian={municipality.custodians[0]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}