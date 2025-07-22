import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { OPRA_CATEGORIES, OpraCategory } from '@/types/opra';
import { vectorStore, VectorSearchResult } from '@/lib/embeddings/vector-store';

const SectionAnalysisSchema = z.object({
  relevantCategories: z.array(z.object({
    categoryId: z.string(),
    relevance: z.enum(['high', 'medium', 'low']),
    reason: z.string(),
  })),
  keyProvisions: z.array(z.string()),
  hasRentControlBoard: z.boolean(),
  hasComplaintProcess: z.boolean(),
  hasEnforcementMechanism: z.boolean(),
});

type SectionAnalysis = z.infer<typeof SectionAnalysisSchema>;

export class OrdinanceAnalyzer {
  private model = openai('gpt-4-turbo');

  /**
   * Analyze an ordinance and determine relevant OPRA categories
   */
  async analyzeOrdinance(ordinanceId: string): Promise<{
    relevantCategories: string[];
    analysis: {
      totalSections: number;
      hasRentControlBoard: boolean;
      hasComplaintProcess: boolean;
      hasEnforcementMechanism: boolean;
      keyProvisions: string[];
      sectionAnalyses: Record<string, SectionAnalysis>;
      totalRelevantCategories: number;
    };
  }> {
    try {
      // Get all chunks for the ordinance
      const chunks = await vectorStore.getOrdinanceChunks(ordinanceId);
      
      if (chunks.length === 0) {
        throw new Error('No chunks found for ordinance');
      }

      // Analyze each significant section
      const sectionAnalyses: Map<string, SectionAnalysis> = new Map();
      const relevantCategoryIds = new Set<string>();
      const overallAnalysis = {
        totalSections: chunks.length,
        hasRentControlBoard: false,
        hasComplaintProcess: false,
        hasEnforcementMechanism: false,
        keyProvisions: [] as string[],
      };

      // Analyze chunks in batches
      for (const chunk of chunks) {
        if (chunk.sectionNumber) {
          const analysis = await this.analyzeSection(chunk.content);
          sectionAnalyses.set(chunk.sectionNumber, analysis);
          
          // Aggregate findings
          analysis.relevantCategories.forEach(cat => {
            if (cat.relevance === 'high' || cat.relevance === 'medium') {
              relevantCategoryIds.add(cat.categoryId);
            }
          });
          
          overallAnalysis.hasRentControlBoard ||= analysis.hasRentControlBoard;
          overallAnalysis.hasComplaintProcess ||= analysis.hasComplaintProcess;
          overallAnalysis.hasEnforcementMechanism ||= analysis.hasEnforcementMechanism;
          if (analysis.keyProvisions.length > 0) {
            overallAnalysis.keyProvisions.push(...analysis.keyProvisions);
          }
        }
      }

      // Always include required categories
      OPRA_CATEGORIES.filter(cat => cat.required).forEach(cat => {
        relevantCategoryIds.add(cat.id);
      });

      // Determine additional categories based on content
      const additionalCategories = await this.determineAdditionalCategories(
        ordinanceId,
        Array.from(relevantCategoryIds)
      );
      
      additionalCategories.forEach(catId => relevantCategoryIds.add(catId));

      return {
        relevantCategories: Array.from(relevantCategoryIds),
        analysis: {
          ...overallAnalysis,
          sectionAnalyses: Object.fromEntries(sectionAnalyses),
          totalRelevantCategories: relevantCategoryIds.size,
        },
      };
    } catch (error) {
      console.error('Error analyzing ordinance:', error);
      throw new Error('Failed to analyze ordinance');
    }
  }

  /**
   * Analyze a specific section of the ordinance
   */
  private async analyzeSection(sectionContent: string): Promise<SectionAnalysis> {
    const categoriesDescription = OPRA_CATEGORIES.map(cat => 
      `${cat.id}: ${cat.name} - ${cat.description}`
    ).join('\n');

    const { object } = await generateObject({
      model: this.model,
      schema: SectionAnalysisSchema,
      prompt: `Analyze this rent control ordinance section and determine which OPRA record categories are relevant.

Section Content:
${sectionContent}

Available OPRA Categories:
${categoriesDescription}

Analyze the section and determine:
1. Which OPRA categories this section relates to (with relevance level)
2. Key provisions that would trigger records requests
3. Whether it mentions a rent control board
4. Whether it describes a complaint process
5. Whether it includes enforcement mechanisms

Focus on identifying concrete records that would exist based on this section.`,
    });

    return object;
  }

  /**
   * Use vector search to find additional relevant categories
   */
  private async determineAdditionalCategories(
    ordinanceId: string,
    existingCategories: string[]
  ): Promise<string[]> {
    const additionalCategories: Set<string> = new Set();

    // Search for specific keywords that indicate certain categories
    const keywordSearches = [
      { keywords: ['complaint', 'appeal', 'dispute'], categoryId: 'tenant-complaints' },
      { keywords: ['violation', 'penalty', 'fine', 'enforcement'], categoryId: 'violations-penalties' },
      { keywords: ['inspection', 'compliance', 'certification'], categoryId: 'compliance-enforcement' },
      { keywords: ['reduction', 'decrease', 'service'], categoryId: 'service-reduction' },
      { keywords: ['professional', 'consultant', 'expert', 'attorney'], categoryId: 'professional-services' },
    ];

    for (const { keywords, categoryId } of keywordSearches) {
      if (!existingCategories.includes(categoryId)) {
        const results = await vectorStore.findChunksByCategory(
          ordinanceId,
          keywords,
          5
        );
        
        if (results.length > 0 && results[0].similarity > 0.75) {
          additionalCategories.add(categoryId);
        }
      }
    }

    return Array.from(additionalCategories);
  }

  /**
   * Generate a summary of what records should be requested
   */
  async generateRecordsSummary(
    ordinanceId: string,
    categoryIds: string[]
  ): Promise<Record<string, string[]>> {
    const recordsSummary: Record<string, string[]> = {};
    
    for (const categoryId of categoryIds) {
      const category = OPRA_CATEGORIES.find(cat => cat.id === categoryId);
      if (!category) continue;

      // Find relevant chunks for this category
      const relevantChunks = await vectorStore.findChunksByCategory(
        ordinanceId,
        [category.name, category.description],
        3
      );

      if (relevantChunks.length > 0) {
        const specificRecords = await this.generateSpecificRecords(
          category,
          relevantChunks
        );
        recordsSummary[categoryId] = specificRecords;
      } else {
        // Use default records for required categories
        recordsSummary[categoryId] = this.getDefaultRecords(category);
      }
    }

    return recordsSummary;
  }

  private async generateSpecificRecords(
    category: OpraCategory,
    relevantChunks: VectorSearchResult[]
  ): Promise<string[]> {
    const context = relevantChunks.map(chunk => chunk.content).join('\n\n');

    const { object } = await generateObject({
      model: this.model,
      schema: z.object({
        records: z.array(z.string()),
      }),
      prompt: `Based on the following ordinance sections, generate a specific list of records to request under the "${category.name}" category.

Category Description: ${category.description}

Relevant Ordinance Sections:
${context}

Generate 3-5 specific record types that would exist based on these ordinance provisions. Be specific and reference the ordinance requirements where applicable.`,
    });

    return object.records;
  }

  private getDefaultRecords(category: OpraCategory): string[] {
    // Default records based on category
    const defaults: Record<string, string[]> = {
      'board-admin': [
        'All meeting minutes from the past 2 years',
        'Meeting agendas and supporting materials',
        'Board member training records and materials',
        'Annual reports submitted to the governing body',
      ],
      'rules-regulations': [
        'All currently effective rules and regulations',
        'Draft rules under consideration',
        'Public comments received on proposed rules',
        'Legal opinions interpreting rules',
      ],
      'general-admin': [
        'General correspondence logs',
        'Policy memoranda and directives',
        'Inter-departmental communications regarding rent control',
      ],
    };

    return defaults[category.id] || [
      `All records related to ${category.name.toLowerCase()}`,
    ];
  }
}

export const ordinanceAnalyzer = new OrdinanceAnalyzer();