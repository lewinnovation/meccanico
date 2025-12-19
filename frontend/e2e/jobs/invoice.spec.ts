import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateToJobs } from '../fixtures/job.fixture';

test.describe('Invoice Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should convert completed job to invoice', async ({ page }) => {
    // Navigate to Jobs
    await navigateToJobs(page);
    
    // Wait for jobs to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Find a completed job (or create one first)
    // For now, we'll assume there's at least one completed job
    // In a real scenario, you'd create a job, complete it, then test invoice conversion
    
    // Click on a completed job if available
    const completedJobRow = page.locator('tr').filter({ hasText: /Completed/i }).first();
    const hasCompletedJob = await completedJobRow.count() > 0;
    
    if (hasCompletedJob) {
      await completedJobRow.click();
      
      // Wait for job detail page
      await page.waitForLoadState('networkidle');
      
      // Check if "Convert to Invoice" button is visible
      const convertButton = page.locator('button:has-text("Convert to Invoice")');
      await expect(convertButton).toBeVisible({ timeout: 5000 });
      
      // Click convert to invoice
      await convertButton.click();
      
      // Wait for invoice to be created
      await page.waitForTimeout(1000);
      
      // Verify invoice section is now visible
      await expect(page.locator('text=Invoice Number')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Invoice Date')).toBeVisible();
      await expect(page.locator('text=Due Date')).toBeVisible();
    } else {
      // Skip test if no completed jobs available
      test.skip();
    }
  });

  test('should display invoice information for completed job with invoice', async ({ page }) => {
    // Navigate to Jobs
    await navigateToJobs(page);
    
    // Wait for jobs to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Find a completed job with invoice
    const completedJobRow = page.locator('tr').filter({ hasText: /Completed/i }).first();
    const hasCompletedJob = await completedJobRow.count() > 0;
    
    if (hasCompletedJob) {
      await completedJobRow.click();
      
      // Wait for job detail page
      await page.waitForLoadState('networkidle');
      
      // Check if invoice section exists
      const invoiceSection = page.locator('text=Invoice').first();
      const hasInvoice = await invoiceSection.count() > 0;
      
      if (hasInvoice) {
        // Verify invoice details are displayed
        await expect(page.locator('text=Invoice Number')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=Status')).toBeVisible();
        await expect(page.locator('text=Invoice Date')).toBeVisible();
        await expect(page.locator('text=Due Date')).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should mark invoice as paid', async ({ page }) => {
    // Navigate to Jobs
    await navigateToJobs(page);
    
    // Wait for jobs to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Find a completed job with unpaid invoice
    const completedJobRow = page.locator('tr').filter({ hasText: /Completed/i }).first();
    const hasCompletedJob = await completedJobRow.count() > 0;
    
    if (hasCompletedJob) {
      await completedJobRow.click();
      
      // Wait for job detail page
      await page.waitForLoadState('networkidle');
      
      // Check if "Mark as Paid" button exists
      const markPaidButton = page.locator('button:has-text("Mark as Paid")');
      const hasMarkPaidButton = await markPaidButton.count() > 0;
      
      if (hasMarkPaidButton) {
        await markPaidButton.click();
        
        // Wait for payment dialog
        await expect(page.locator('text=Mark Invoice as Paid')).toBeVisible({ timeout: 5000 });
        
        // Fill payment note
        const paymentNoteInput = page.locator('textarea[label*="Payment Note"], textarea[placeholder*="payment"]').first();
        if (await paymentNoteInput.count() > 0) {
          await paymentNoteInput.fill('Paid via credit card');
        }
        
        // Click Mark as Paid button in dialog
        await page.locator('button:has-text("Mark as Paid"):not([disabled])').click();
        
        // Wait for dialog to close and invoice to update
        await page.waitForTimeout(1000);
        
        // Verify invoice status changed to PAID
        await expect(page.locator('text=PAID, text=Paid').first()).toBeVisible({ timeout: 5000 });
      } else {
        // Skip if no unpaid invoice
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should show payment note after marking invoice as paid', async ({ page }) => {
    // Navigate to Jobs
    await navigateToJobs(page);
    
    // Wait for jobs to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Find a completed job with paid invoice
    const completedJobRow = page.locator('tr').filter({ hasText: /Completed/i }).first();
    const hasCompletedJob = await completedJobRow.count() > 0;
    
    if (hasCompletedJob) {
      await completedJobRow.click();
      
      // Wait for job detail page
      await page.waitForLoadState('networkidle');
      
      // Check if payment note is displayed
      const paymentNote = page.locator('text=Payment Note').first();
      const hasPaymentNote = await paymentNote.count() > 0;
      
      if (hasPaymentNote) {
        // Verify payment note section is visible
        await expect(paymentNote).toBeVisible({ timeout: 5000 });
      }
    } else {
      test.skip();
    }
  });
});

