import { OPRA_CATEGORIES } from '@/types/opra';
import { Municipality, Custodian, Ordinance } from '@prisma/client';

export interface OpraRequestData {
  municipality: Municipality;
  ordinance: Ordinance;
  custodian?: Custodian | null;
  selectedCategories: string[];
  recordsSummary: Record<string, string[]>;
  customizations?: Record<string, any>;
}

export class OpraRequestGenerator {
  /**
   * Generate the full OPRA request text
   */
  generateRequest(data: OpraRequestData): string {
    const { municipality, ordinance, custodian, selectedCategories, recordsSummary } = data;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let request = this.generateHeader(currentDate, municipality, custodian);
    request += this.generateIntroduction(municipality, ordinance);
    request += this.generateRecordsSection(selectedCategories, recordsSummary);
    request += this.generateClosing();

    return request;
  }

  private generateHeader(date: string, municipality: Municipality, custodian?: Custodian | null): string {
    const custodianName = custodian?.name || 'Municipal Clerk';
    const custodianTitle = custodian?.title || 'OPRA Custodian';
    
    return `${date}

${custodianName}
${custodianTitle}
${municipality.name} Municipality
${custodian?.address || `${municipality.name}, NJ`}

Via Email${custodian?.email ? `: ${custodian.email}` : ''}

Re: OPRA Request - Rent Control Ordinance Records

Dear ${custodianName}:

`;
  }

  private generateIntroduction(municipality: Municipality, ordinance: Ordinance): string {
    const ordinanceRef = ordinance.code ? ` (${ordinance.code})` : '';
    
    return `Pursuant to the Open Public Records Act (OPRA), N.J.S.A. 47:1A-1 et seq., I hereby request access to inspect and/or obtain copies of the following government records relating to ${municipality.name}'s Rent Control Ordinance${ordinanceRef}:

`;
  }

  private generateRecordsSection(selectedCategories: string[], recordsSummary: Record<string, string[]>): string {
    let recordsText = '';
    let categoryNumber = 1;

    for (const categoryId of selectedCategories) {
      const category = OPRA_CATEGORIES.find(cat => cat.id === categoryId);
      if (!category) continue;

      const specificRecords = recordsSummary[categoryId] || [];
      
      recordsText += `${categoryNumber}. **${category.name}**\n\n`;
      
      if (specificRecords.length > 0) {
        specificRecords.forEach(record => {
          recordsText += `   • ${record}\n`;
        });
      } else {
        recordsText += `   • All records related to ${category.description.toLowerCase()}\n`;
      }
      
      recordsText += '\n';
      categoryNumber++;
    }

    return recordsText;
  }

  private generateClosing(): string {
    return `**Time Period**: Please provide records from the past three (3) years, or since the effective date of the current rent control ordinance, whichever is shorter.

**Format Preference**: Electronic copies via email are preferred when available. For records that exist only in paper format, please advise of the cost for copies.

**Fee Waiver Request**: As this request is in the public interest and will contribute to public understanding of governmental operations, I request a waiver of any fees associated with this request. If fees cannot be waived, please inform me of the cost before processing this request if it exceeds $25.

If any portion of this request is denied, please provide the specific legal basis for each denial, as required by N.J.S.A. 47:1A-5(g).

I understand that a response is required within seven (7) business days pursuant to N.J.S.A. 47:1A-5(i). If you need clarification on any aspect of this request, please contact me promptly.

Thank you for your assistance with this request.

Sincerely,

[Requestor Name]
[Contact Information]`;
  }

  /**
   * Generate a customized request based on specific ordinance provisions
   */
  generateCustomizedRequest(
    data: OpraRequestData,
    customProvisions: string[]
  ): string {
    let request = this.generateRequest(data);
    
    if (customProvisions.length > 0) {
      const customSection = `\n\n**Additional Records Based on Specific Ordinance Provisions**:\n\n`;
      const provisionsText = customProvisions.map((provision, index) => 
        `${index + 1}. ${provision}`
      ).join('\n');
      
      // Insert custom provisions before the closing
      const closingIndex = request.indexOf('**Time Period**');
      request = request.slice(0, closingIndex) + customSection + provisionsText + '\n\n' + request.slice(closingIndex);
    }
    
    return request;
  }

  /**
   * Generate a shorter, focused request for specific categories
   */
  generateFocusedRequest(
    data: OpraRequestData,
    focusCategories: string[]
  ): string {
    const filteredData = {
      ...data,
      selectedCategories: focusCategories,
    };
    
    return this.generateRequest(filteredData);
  }
}