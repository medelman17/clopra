import { put, del } from '@vercel/blob';
import { opraPdfGenerator } from './generator';
import { OpraRequestData } from '@/lib/opra/generator';

export class PdfStorageService {
  /**
   * Generate a PDF and store it in Vercel Blob storage
   */
  async generateAndStorePdf(
    requestId: string,
    requestText: string,
    data: OpraRequestData
  ): Promise<string> {
    try {
      // Generate PDF buffer
      const pdfBuffer = await opraPdfGenerator.generatePdf(requestText, data);
      
      // Create filename
      const filename = `opra-requests/${data.municipality.name.toLowerCase().replace(/\s+/g, '-')}-${requestId}.pdf`;
      
      // Upload to Vercel Blob
      const blob = await put(filename, pdfBuffer, {
        access: 'public',
        contentType: 'application/pdf',
      });
      
      return blob.url;
    } catch (error) {
      console.error('Error generating/storing PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }
  
  /**
   * Delete a PDF from storage
   */
  async deletePdf(url: string): Promise<void> {
    try {
      await del(url);
    } catch (error) {
      console.error('Error deleting PDF:', error);
      // Non-critical error, log but don't throw
    }
  }
  
  /**
   * Generate a temporary PDF for preview (returns base64)
   */
  async generatePreviewPdf(
    requestText: string,
    data: OpraRequestData
  ): Promise<string> {
    return opraPdfGenerator.generatePdfBase64(requestText, data);
  }
}

export const pdfStorage = new PdfStorageService();