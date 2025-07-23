'use client';

import { Card, CardDescription, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
}

export function CategorySelector({
  categories,
  selectedCategories,
  onToggleCategory,
}: CategorySelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4" />
        <p>Select the categories you want to include in your OPRA request</p>
      </div>

      <div className="space-y-3">
        {categories.map((category) => (
          <Card 
            key={category.id}
            className={`cursor-pointer transition-colors ${
              selectedCategories.includes(category.id) 
                ? 'border-primary bg-primary/5' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => onToggleCategory(category.id)}
          >
            <CardHeader className="py-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => onToggleCategory(category.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{category.name}</h4>
                    {selectedCategories.includes(category.id) && (
                      <Badge variant="secondary" className="text-xs">
                        Included
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {category.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">
          {selectedCategories.length} categories selected
        </p>
        <p className="text-xs text-muted-foreground">
          Each category will add specific questions to your OPRA request. 
          You can edit the questions after selecting categories.
        </p>
      </div>
    </div>
  );
}