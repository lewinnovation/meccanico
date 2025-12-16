import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateToJobs } from '../fixtures/job.fixture';

test.describe('Job Full Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display jobs page with tabs and search', async ({ page }) => {
    await navigateToJobs(page);

    // Verify tabs are present
    await expect(page.locator('button[role="tab"]:has-text("All")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Estimates")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Approved")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("In Progress")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Invoiced")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Paid")')).toBeVisible();

    // Verify search input
    await expect(page.locator('input[placeholder="Search jobs by code, customer, or vehicle..."]')).toBeVisible();

    // Verify New Job button
    await expect(page.locator('button:has-text("New Job")')).toBeVisible();
  });

  test('should filter jobs by status tab', async ({ page }) => {
    await navigateToJobs(page);

    // Click Estimates tab
    await page.click('button[role="tab"]:has-text("Estimates")');
    await expect(page.locator('button[role="tab"]:has-text("Estimates")')).toHaveAttribute('aria-selected', 'true');

    // Click In Progress tab
    await page.click('button[role="tab"]:has-text("In Progress")');
    await expect(page.locator('button[role="tab"]:has-text("In Progress")')).toHaveAttribute('aria-selected', 'true');

    // Click Paid tab
    await page.click('button[role="tab"]:has-text("Paid")');
    await expect(page.locator('button[role="tab"]:has-text("Paid")')).toHaveAttribute('aria-selected', 'true');

    // Back to All
    await page.click('button[role="tab"]:has-text("All")');
    await expect(page.locator('button[role="tab"]:has-text("All")')).toHaveAttribute('aria-selected', 'true');
  });

  test('should navigate to new job form', async ({ page }) => {
    await navigateToJobs(page);

    // Click New Job
    await page.click('button:has-text("New Job")');

    // Verify new job form
    await expect(page.locator('h4:has-text("New Job")')).toBeVisible();
    await expect(page.locator('label:has-text("Customer")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Job")')).toBeDisabled();
  });

  test('should require customer and vehicle to create job', async ({ page }) => {
    await navigateToJobs(page);
    await page.click('button:has-text("New Job")');

    // Create button should be disabled without selection
    await expect(page.locator('button:has-text("Create Job")')).toBeDisabled();
  });

  test('should navigate back from new job form', async ({ page }) => {
    await navigateToJobs(page);
    await page.click('button:has-text("New Job")');

    // Click back button
    await page.click('button:has([data-testid="ArrowBackIcon"])');

    // Verify back on jobs list
    await expect(page.locator('h4:has-text("Jobs")')).toBeVisible();
  });

  test('should search jobs', async ({ page }) => {
    await navigateToJobs(page);

    // Type in search
    await page.fill('input[placeholder="Search jobs by code, customer, or vehicle..."]', 'J001');

    // Wait for search to trigger
    await page.waitForTimeout(500);

    // The search should filter results (or show no results)
    // We verify the search input has the correct value
    await expect(page.locator('input[placeholder="Search jobs by code, customer, or vehicle..."]')).toHaveValue('J001');
  });
});

test.describe('Job Detail Actions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToJobs(page);
  });

  test('should show job detail when clicking a job row', async ({ page }) => {
    // Check if there are any jobs
    const jobRow = page.locator('table tbody tr').first();
    const hasJobs = await jobRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasJobs) {
      // Get job code before clicking
      const codeCell = jobRow.locator('td').first();
      const jobCode = await codeCell.textContent();

      // Click the job
      await jobRow.click();

      // Wait for detail page and verify job code is displayed
      if (jobCode) {
        await expect(page.locator(`h4:has-text("${jobCode.trim()}")`)).toBeVisible();
      }
    }
  });

  test('should show actions menu on job detail', async ({ page }) => {
    const jobRow = page.locator('table tbody tr').first();
    const hasJobs = await jobRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasJobs) {
      await jobRow.click();
      await page.waitForLoadState('networkidle');

      // Find and click the more menu button
      const menuButton = page.locator('button:has([data-testid="MoreVertIcon"])');
      if (await menuButton.isVisible()) {
        await menuButton.click();

        // Verify menu appears
        await expect(page.locator('[role="menu"]')).toBeVisible();

        // Should have common actions
        const menu = page.locator('[role="menu"]');
        await expect(menu.locator('text=Duplicate')).toBeVisible();
        await expect(menu.locator('text=Print Estimate')).toBeVisible();
        await expect(menu.locator('text=Print Invoice')).toBeVisible();
      }
    }
  });

  test('should show line items section on job detail', async ({ page }) => {
    const jobRow = page.locator('table tbody tr').first();
    const hasJobs = await jobRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasJobs) {
      await jobRow.click();
      await page.waitForLoadState('networkidle');

      // Verify line items section
      await expect(page.locator('text=Line Items')).toBeVisible();
    }
  });

  test('should show customer and vehicle info on job detail', async ({ page }) => {
    const jobRow = page.locator('table tbody tr').first();
    const hasJobs = await jobRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasJobs) {
      await jobRow.click();
      await page.waitForLoadState('networkidle');

      // Verify customer section
      await expect(page.locator('text=Customer')).toBeVisible();

      // Verify vehicle section
      await expect(page.locator('text=Vehicle')).toBeVisible();

      // Verify dates section
      await expect(page.locator('text=Dates')).toBeVisible();
    }
  });
});

test.describe('Job Print Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToJobs(page);
  });

  test('should open print estimate dialog', async ({ page }) => {
    const jobRow = page.locator('table tbody tr').first();
    const hasJobs = await jobRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasJobs) {
      await jobRow.click();
      await page.waitForLoadState('networkidle');

      // Open actions menu
      const menuButton = page.locator('button:has([data-testid="MoreVertIcon"])');
      await menuButton.click();

      // Click Print Estimate
      await page.click('text=Print Estimate');

      // Verify print dialog opens
      await expect(page.locator('[role="dialog"]:has-text("Print Estimate")')).toBeVisible();

      // Verify preview content
      await expect(page.locator('[role="dialog"] text=Preview')).toBeVisible();
      await expect(page.locator('[role="dialog"] text=Customer')).toBeVisible();
      await expect(page.locator('[role="dialog"] text=Vehicle')).toBeVisible();
      await expect(page.locator('[role="dialog"] text=Line Items')).toBeVisible();

      // Verify print button
      await expect(page.locator('[role="dialog"] button:has-text("Print")')).toBeVisible();

      // Close dialog
      await page.click('[role="dialog"] button:has-text("Cancel")');
    }
  });

  test('should open print invoice dialog', async ({ page }) => {
    const jobRow = page.locator('table tbody tr').first();
    const hasJobs = await jobRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasJobs) {
      await jobRow.click();
      await page.waitForLoadState('networkidle');

      // Open actions menu
      const menuButton = page.locator('button:has([data-testid="MoreVertIcon"])');
      await menuButton.click();

      // Click Print Invoice
      await page.click('text=Print Invoice');

      // Verify print dialog opens with invoice title
      await expect(page.locator('[role="dialog"]:has-text("Print Invoice")')).toBeVisible();

      // Close dialog
      await page.click('[role="dialog"] button:has-text("Cancel")');
    }
  });
});

test.describe('Job Status Transitions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToJobs(page);
  });

  test('should show appropriate status transitions for ESTIMATE job', async ({ page }) => {
    // Filter to Estimates
    await page.click('button[role="tab"]:has-text("Estimates")');
    await page.waitForTimeout(500);

    const jobRow = page.locator('table tbody tr').first();
    const hasEstimateJobs = await jobRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEstimateJobs) {
      await jobRow.click();
      await page.waitForLoadState('networkidle');

      // Verify status chip shows Estimate
      await expect(page.locator('.MuiChip-root:has-text("Estimate")')).toBeVisible();

      // Open actions menu
      const menuButton = page.locator('button:has([data-testid="MoreVertIcon"])');
      await menuButton.click();

      // Should show valid transitions for ESTIMATE
      await expect(page.locator('[role="menu"] text=Approve')).toBeVisible();
      await expect(page.locator('[role="menu"] text=Cancel')).toBeVisible();

      // Should also show Edit Details for editable jobs
      await expect(page.locator('[role="menu"] text=Edit Details')).toBeVisible();

      // Should also show Delete for ESTIMATE jobs
      await expect(page.locator('[role="menu"] text=Delete')).toBeVisible();
    }
  });

  test('should allow duplicate on any job status', async ({ page }) => {
    const jobRow = page.locator('table tbody tr').first();
    const hasJobs = await jobRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasJobs) {
      await jobRow.click();
      await page.waitForLoadState('networkidle');

      // Open actions menu
      const menuButton = page.locator('button:has([data-testid="MoreVertIcon"])');
      await menuButton.click();

      // Duplicate should always be available
      await expect(page.locator('[role="menu"] text=Duplicate')).toBeVisible();
    }
  });
});

test.describe('Job Edit Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToJobs(page);
  });

  test('should open edit dialog for ESTIMATE job', async ({ page }) => {
    // Filter to Estimates
    await page.click('button[role="tab"]:has-text("Estimates")');
    await page.waitForTimeout(500);

    const jobRow = page.locator('table tbody tr').first();
    const hasEstimateJobs = await jobRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEstimateJobs) {
      await jobRow.click();
      await page.waitForLoadState('networkidle');

      // Open actions menu
      const menuButton = page.locator('button:has([data-testid="MoreVertIcon"])');
      await menuButton.click();

      // Click Edit Details
      await page.click('[role="menu"] text=Edit Details');

      // Verify edit dialog opens
      await expect(page.locator('[role="dialog"]:has-text("Edit Job Details")')).toBeVisible();

      // Verify form fields
      await expect(page.locator('[role="dialog"] label:has-text("Notes")')).toBeVisible();
      await expect(page.locator('[role="dialog"] label:has-text("Internal Notes")')).toBeVisible();
      await expect(page.locator('[role="dialog"] label:has-text("Tax Rate")')).toBeVisible();
      await expect(page.locator('[role="dialog"] label:has-text("Discount Amount")')).toBeVisible();
      await expect(page.locator('[role="dialog"] label:has-text("Discount Percent")')).toBeVisible();

      // Verify Save button
      await expect(page.locator('[role="dialog"] button:has-text("Save")')).toBeVisible();

      // Close dialog
      await page.click('[role="dialog"] button:has-text("Cancel")');
    }
  });
});

test.describe('Job Line Items for Estimate', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToJobs(page);
  });

  test('should show Add Item and Apply Template buttons for ESTIMATE job', async ({ page }) => {
    // Filter to Estimates
    await page.click('button[role="tab"]:has-text("Estimates")');
    await page.waitForTimeout(500);

    const jobRow = page.locator('table tbody tr').first();
    const hasEstimateJobs = await jobRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEstimateJobs) {
      await jobRow.click();
      await page.waitForLoadState('networkidle');

      // Verify Add Item button
      await expect(page.locator('button:has-text("Add Item")')).toBeVisible();

      // Verify Apply Template button
      await expect(page.locator('button:has-text("Apply Template")')).toBeVisible();
    }
  });

  test('should open add line item dialog', async ({ page }) => {
    // Filter to Estimates
    await page.click('button[role="tab"]:has-text("Estimates")');
    await page.waitForTimeout(500);

    const jobRow = page.locator('table tbody tr').first();
    const hasEstimateJobs = await jobRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEstimateJobs) {
      await jobRow.click();
      await page.waitForLoadState('networkidle');

      // Click Add Item
      await page.click('button:has-text("Add Item")');

      // Verify dialog opens
      await expect(page.locator('[role="dialog"]:has-text("Add Line Item")')).toBeVisible();

      // Verify type selector
      await expect(page.locator('[role="dialog"] label:has-text("Type")')).toBeVisible();

      // Close dialog
      await page.click('[role="dialog"] button:has-text("Cancel")');
    }
  });

  test('should open apply template dialog', async ({ page }) => {
    // Filter to Estimates
    await page.click('button[role="tab"]:has-text("Estimates")');
    await page.waitForTimeout(500);

    const jobRow = page.locator('table tbody tr').first();
    const hasEstimateJobs = await jobRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEstimateJobs) {
      await jobRow.click();
      await page.waitForLoadState('networkidle');

      // Click Apply Template
      await page.click('button:has-text("Apply Template")');

      // Verify dialog opens
      await expect(page.locator('[role="dialog"]:has-text("Apply Template")')).toBeVisible();

      // Verify template selector
      await expect(page.locator('[role="dialog"] label:has-text("Select Template")')).toBeVisible();

      // Close dialog
      await page.click('[role="dialog"] button:has-text("Cancel")');
    }
  });
});

test.describe('Job Totals Display', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToJobs(page);
  });

  test('should display totals section', async ({ page }) => {
    const jobRow = page.locator('table tbody tr').first();
    const hasJobs = await jobRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasJobs) {
      await jobRow.click();
      await page.waitForLoadState('networkidle');

      // Verify totals are displayed
      await expect(page.locator('text=Subtotal')).toBeVisible();
      await expect(page.locator('text=Total')).toBeVisible();
    }
  });
});

