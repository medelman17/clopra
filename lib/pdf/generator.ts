import { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import { OpraRequestData } from '@/lib/opra/generator';
import { pdfStyles, defaultPageMargins, pageSize, defaultPageOrientation } from './styles';

// Dynamic import for server-side PDF generation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createPdf(docDefinition: TDocumentDefinitions): Promise<any> {
  if (typeof window === 'undefined') {
    // Server-side
    const pdfMakePrinter = await import('pdfmake/build/pdfmake');
    const pdfFonts = await import('pdfmake/build/vfs_fonts');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfMake = (pdfMakePrinter as any).default || pdfMakePrinter;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pdfMake as any).vfs = (pdfFonts as any).default.pdfMake.vfs;
    
    return pdfMake.createPdf(docDefinition);
  } else {
    // Client-side
    const pdfMake = (await import('pdfmake/build/pdfmake')).default;
    await import('pdfmake/build/vfs_fonts');
    return pdfMake.createPdf(docDefinition);
  }
}

export class OpraPdfGenerator {
  /**
   * Generate a PDF buffer for an OPRA request
   */
  async generatePdf(
    requestText: string,
    data: OpraRequestData
  ): Promise<Buffer> {
    const docDefinition = this.createDocumentDefinition(requestText, data);
    const pdfDoc = await createPdf(docDefinition);
    
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfDoc.getBuffer((buffer: any) => {
        resolve(Buffer.from(buffer));
      }, reject);
    });
  }

  /**
   * Generate a base64 encoded PDF for client-side use
   */
  async generatePdfBase64(
    requestText: string,
    data: OpraRequestData
  ): Promise<string> {
    const docDefinition = this.createDocumentDefinition(requestText, data);
    const pdfDoc = await createPdf(docDefinition);
    
    return new Promise((resolve, reject) => {
      pdfDoc.getBase64(resolve, reject);
    });
  }

  private createDocumentDefinition(
    requestText: string,
    data: OpraRequestData
  ): TDocumentDefinitions {
    const { municipality, ordinance, custodian, selectedCategories, recordsSummary } = data;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const content: Content = [
      // Header with municipality seal placeholder
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'OPEN PUBLIC RECORDS ACT REQUEST', style: 'header' },
              { text: `${municipality.name}, New Jersey`, style: 'subheader' },
              { text: currentDate, style: 'body' },
            ],
          },
          {
            width: 'auto',
            text: 'OFFICIAL REQUEST', 
            style: 'watermark',
            alignment: 'right',
          },
        ],
      },
      
      // Separator line
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 5,
            x2: 515,
            y2: 5,
            lineWidth: 1,
            lineColor: '#e2e8f0',
          },
        ],
        margin: [0, 20, 0, 20] as [number, number, number, number],
      },

      // Recipient information
      {
        stack: [
          { text: 'TO:', style: 'label' },
          { text: custodian?.name || 'Municipal Clerk', style: 'value' },
          { text: custodian?.title || 'OPRA Custodian', style: 'value' },
          { text: `${municipality.name} Municipality`, style: 'value' },
          custodian?.address ? { text: custodian.address, style: 'value' } : null,
          custodian?.email ? { 
            text: `Email: ${custodian.email}`, 
            style: 'value',
            link: `mailto:${custodian.email}`,
            color: '#2563eb',
          } : null,
        ].filter(Boolean) as Content[],
      },

      // Subject line
      {
        margin: [0, 20, 0, 10] as [number, number, number, number],
        text: [
          { text: 'RE: ', style: 'label' },
          { text: `OPRA Request - ${ordinance.title}`, style: 'value' },
          ordinance.code ? { text: ` (${ordinance.code})`, style: 'value' } : '',
        ],
      },

      // Main request content
      {
        text: this.formatRequestContent(requestText, selectedCategories, recordsSummary),
        style: 'body',
        margin: [0, 10, 0, 0] as [number, number, number, number],
      },

      // Legal notice
      {
        margin: [0, 30, 0, 0] as [number, number, number, number],
        stack: [
          {
            text: 'Legal Notice',
            style: 'subheader',
          },
          {
            text: 'This request is made pursuant to the Open Public Records Act (OPRA), N.J.S.A. 47:1A-1 et seq. A response is required within seven (7) business days pursuant to N.J.S.A. 47:1A-5(i).',
            style: 'footer',
            margin: [0, 5, 0, 0] as [number, number, number, number],
          },
        ],
      },
    ];

    return {
      pageSize,
      pageOrientation: defaultPageOrientation,
      pageMargins: defaultPageMargins,
      content,
      styles: pdfStyles,
      
      // Professional header
      header: (currentPage: number, pageCount: number) => {
        if (currentPage === 1) return null;
        return {
          text: `OPRA Request - ${municipality.name} - Page ${currentPage} of ${pageCount}`,
          style: 'footer',
          alignment: 'center',
          margin: [60, 30, 60, 0] as [number, number, number, number],
        };
      },
      
      // Professional footer
      footer: (currentPage: number, pageCount: number) => {
        return {
          columns: [
            {
              text: `Generated on ${currentDate}`,
              style: 'footer',
              alignment: 'left',
            },
            {
              text: `Page ${currentPage} of ${pageCount}`,
              style: 'footer',
              alignment: 'right',
            },
          ],
          margin: [60, 0, 60, 30] as [number, number, number, number],
        };
      },
      
      // Metadata
      info: {
        title: `OPRA Request - ${municipality.name}`,
        author: 'OPRA Request Generator',
        subject: `Rent Control Ordinance Records Request`,
        keywords: 'OPRA, rent control, municipal records',
        creator: 'NJ OPRA Request Generator',
        producer: 'NJ OPRA Request Generator',
      },
    };
  }

  private formatRequestContent(
    requestText: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selectedCategories: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    recordsSummary: Record<string, string[]>
  ): Content[] {
    const content: Content[] = [];
    
    // Parse the request text to extract sections
    const lines = requestText.split('\n');
    let currentSection: Content[] = [];
    let inRecordsSection = false;
    
    for (const line of lines) {
      // Check if we're entering a numbered category section
      const categoryMatch = line.match(/^(\d+)\.\s+\*\*(.+)\*\*/);
      if (categoryMatch) {
        if (currentSection.length > 0) {
          content.push({ stack: currentSection });
          currentSection = [];
        }
        
        const categoryName = categoryMatch[2];
        content.push({
          text: `${categoryMatch[1]}. ${categoryName}`,
          style: 'categoryHeader',
        });
        inRecordsSection = true;
        continue;
      }
      
      // Check for bullet points
      if (line.trim().startsWith('•') && inRecordsSection) {
        content.push({
          text: line.trim(),
          style: 'bulletItem',
        });
        continue;
      }
      
      // Check for section headers (bold text)
      if (line.includes('**') && !categoryMatch) {
        const formattedLine = line.replace(/\*\*(.+?)\*\*/g, (match, p1) => p1);
        content.push({
          text: formattedLine,
          style: 'subheader',
          margin: [0, 15, 0, 5] as [number, number, number, number],
        });
        inRecordsSection = false;
        continue;
      }
      
      // Regular paragraph text
      if (line.trim()) {
        currentSection.push({
          text: line,
          style: 'body',
          margin: [0, 2, 0, 2] as [number, number, number, number],
        });
      }
    }
    
    // Add any remaining section
    if (currentSection.length > 0) {
      content.push({ stack: currentSection });
    }
    
    return content;
  }
}

export const opraPdfGenerator = new OpraPdfGenerator();