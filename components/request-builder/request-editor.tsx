'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Plus,
  GripVertical
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface RequestSection {
  id: string;
  title: string;
  content: string;
  category: string;
  isCustom?: boolean;
}

interface RequestEditorProps {
  sections: RequestSection[];
  onUpdateSection: (sectionId: string, content: string) => void;
  onAddSection: () => void;
  onDeleteSection: (sectionId: string) => void;
  selectedCategories: string[];
}

export function RequestEditor({
  sections,
  onUpdateSection,
  onAddSection,
  onDeleteSection,
  selectedCategories,
}: RequestEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['header', 'footer'])
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isSectionVisible = (section: RequestSection) => {
    if (section.category === 'header' || section.category === 'footer') return true;
    if (section.isCustom) return true;
    return selectedCategories.includes(section.category);
  };

  const visibleSections = sections.filter(isSectionVisible);

  return (
    <div className="space-y-4">
      {visibleSections.map((section) => (
        <Card key={section.id} className="overflow-hidden">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <CardTitle className="text-base">{section.title}</CardTitle>
                {section.isCustom && (
                  <Badge variant="secondary" className="text-xs">Custom</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {section.isCustom && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteSection(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection(section.id)}
                  >
                    {expandedSections.has(section.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <Collapsible open={expandedSections.has(section.id)}>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {section.isCustom && (
                  <Input
                    placeholder="Section title"
                    value={section.title}
                    onChange={(e) => {
                      // You might want to add a separate handler for title updates
                      section.title = e.target.value;
                    }}
                    className="mb-3"
                  />
                )}
                <Textarea
                  value={section.content}
                  onChange={(e) => onUpdateSection(section.id, e.target.value)}
                  placeholder="Enter your request content..."
                  className="min-h-[150px] font-mono text-sm"
                />
                <div className="mt-2 text-xs text-muted-foreground">
                  {section.content.length} characters
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}

      <Button
        variant="outline"
        onClick={onAddSection}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Custom Section
      </Button>
    </div>
  );
}