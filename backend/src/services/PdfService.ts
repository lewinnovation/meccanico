import puppeteer from 'puppeteer';

export interface PdfOptions {
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
}

export class PdfService {
  /**
   * Generate PDF from HTML content using Puppeteer
   */
  async generateFromHtml(html: string, options?: PdfOptions): Promise<Buffer> {
    let browser;
    try {
      // Determine executable path - use env var if set, otherwise let Puppeteer find it
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
      
      // Launch browser with improved configuration
      const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-web-security',
        ],
        timeout: 30000, // 30 second timeout for browser launch
      };
      
      // Only set executablePath if provided
      if (executablePath) {
        launchOptions.executablePath = executablePath;
      }
      
      browser = await puppeteer.launch(launchOptions);

      const page = await browser.newPage();
      
      // Set a reasonable timeout for page operations
      page.setDefaultTimeout(30000);
      
      // Set content with improved error handling
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Generate PDF with timeout
      const pdfBuffer = await page.pdf({
        format: options?.format || 'A4',
        margin: options?.margin || {
          top: '0.5cm',
          right: '0.5cm',
          bottom: '0.5cm',
          left: '0.5cm',
        },
        printBackground: options?.printBackground !== false,
        timeout: 30000,
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      // Log the full error for debugging
      console.error('PdfService error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error,
      });
      
      // Provide more detailed error messages
      if (error instanceof Error) {
        // Check for common Puppeteer errors
        if (error.message.includes('Browser closed') || error.message.includes('Target closed')) {
          throw new Error('PDF generation failed: Browser closed unexpectedly. This may be due to insufficient system resources or browser crash.');
        }
        if (error.message.includes('Navigation timeout') || error.message.includes('Timeout')) {
          throw new Error('PDF generation failed: Operation timed out. The HTML content may be too complex or contain external resources that are slow to load.');
        }
        if (error.message.includes('Protocol error') || error.message.includes('Session closed')) {
          throw new Error('PDF generation failed: Browser protocol error. This may indicate a compatibility issue with the installed browser.');
        }
        if (error.message.includes('Could not find browser') || error.message.includes('Executable doesn\'t exist')) {
          throw new Error('PDF generation failed: Could not find browser executable. Puppeteer may need to download Chromium. Check your internet connection and try again.');
        }
        throw new Error(`Failed to generate PDF: ${error.message}`);
      }
      throw new Error(`Failed to generate PDF: Unknown error occurred`);
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          // Log but don't throw - the PDF may have been generated successfully
          console.error('Error closing browser:', closeError);
        }
      }
    }
  }
}


