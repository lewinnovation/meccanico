import { Page, expect } from '@playwright/test';

export interface JobFixture {
  loginAsAdmin: (page: Page) => Promise<void>;
  createCustomerWithVehicle: (page: Page, customerName: string) => Promise<{ customerId: string; vehicleId: string }>;
  createJob: (page: Page, customerName: string) => Promise<string>;
  navigateToJobs: (page: Page) => Promise<void>;
  navigateToJobDetail: (page: Page, jobCode: string) => Promise<void>;
  addLineItem: (page: Page, type: 'Part' | 'Labour' | 'Service' | 'Text', description?: string) => Promise<void>;
  transitionStatus: (page: Page, action: string) => Promise<void>;
}

export const loginAsAdmin = async (page: Page): Promise<void> => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@meccanico.dev');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
};

export const navigateToJobs = async (page: Page): Promise<void> => {
  // Navigate directly to jobs page - more reliable than clicking sidebar
  await page.goto('/jobs');
  await expect(page.locator('h4:has-text("Jobs")')).toBeVisible({ timeout: 10000 });
};

export const createCustomerWithVehicle = async (
  page: Page,
  customerName: string
): Promise<{ customerId: string; vehicleId: string }> => {
  // Navigate to Customers
  await page.click('button:has-text("Customers")');
  await expect(page.locator('h4:has-text("Customers")')).toBeVisible();
  
  // Create new customer
  await page.click('button:has-text("New Customer")');
  await page.fill('input[name="name"]', customerName);
  await page.fill('input[name="email"]', `${customerName.toLowerCase().replace(/\s/g, '')}${Date.now()}@test.com`);
  await page.fill('input[name="phone"]', '555-1234');
  await page.click('button:has-text("Create")');
  
  // Wait for customer to be created and navigate to detail
  await page.waitForURL(/\/customers\/[a-f0-9-]+$/);
  const customerId = page.url().split('/').pop() || '';
  
  // Add a vehicle
  await page.click('button:has-text("Add Vehicle")');
  await page.fill('input[name="make"]', 'Toyota');
  await page.fill('input[name="model"]', 'Camry');
  await page.click('button:has-text("Add Vehicle")');
  
  // Wait for vehicle to be added (dialog closes)
  await page.waitForTimeout(1000);
  
  // Get the vehicle ID from the table
  const vehicleId = 'vehicle-placeholder'; // In real tests, extract from DOM or API
  
  return { customerId, vehicleId };
};

export const createJob = async (page: Page, customerName: string): Promise<string> => {
  // Navigate to Jobs
  await navigateToJobs(page);
  
  // Click New Job
  await page.click('button:has-text("New Job")');
  await expect(page.locator('h4:has-text("New Job")')).toBeVisible();
  
  // Select customer
  await page.click('input[aria-label="Customer"]');
  await page.fill('input[aria-label="Customer"]', customerName);
  await page.click(`li:has-text("${customerName}")`);
  
  // Wait for vehicles to load
  await page.waitForTimeout(1000);
  
  // Select first vehicle
  const vehicleSelect = page.locator('select[name="vehicle"], div:has(label:text("Vehicle")) select');
  if (await vehicleSelect.isVisible()) {
    await vehicleSelect.selectOption({ index: 1 });
  }
  
  // Create job
  await page.click('button:has-text("Create Job")');
  
  // Wait for navigation to job detail
  await page.waitForURL(/\/jobs\/[a-f0-9-]+$/);
  
  // Get job code from header
  const jobCodeElement = page.locator('h4').first();
  const jobCode = await jobCodeElement.textContent() || '';
  
  return jobCode;
};

export const addLineItem = async (
  page: Page,
  type: 'Part' | 'Labour' | 'Service' | 'Text',
  description?: string
): Promise<void> => {
  // Click Add Item button
  await page.click('button:has-text("Add Item")');
  
  // Wait for dialog
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  
  // Select type
  const typeMapping: Record<string, string> = {
    'Part': 'Part (from inventory)',
    'Labour': 'Labour',
    'Service': 'Service',
    'Text': 'Text (custom description)',
  };
  
  await page.click('div[role="combobox"]:has-text("Part")');
  await page.click(`li:has-text("${typeMapping[type]}")`);
  
  if (type === 'Text') {
    await page.fill('input[label="Description"]', description || 'Test custom item');
    await page.fill('input[label="Unit Price"]', '25');
  }
  
  // Click Add
  await page.click('button:has-text("Add"):not(:disabled)');
  
  // Wait for dialog to close
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
};

export const transitionStatus = async (page: Page, action: string): Promise<void> => {
  // Open the more menu
  await page.click('button[aria-label="more"]');
  
  // Wait for menu
  await expect(page.locator('[role="menu"]')).toBeVisible();
  
  // Click the action
  await page.click(`li:has-text("${action}")`);
  
  // Wait for status update
  await page.waitForTimeout(500);
};

export const navigateToJobDetail = async (page: Page, jobCode: string): Promise<void> => {
  await navigateToJobs(page);
  
  // Search for the job
  await page.fill('input[placeholder="Search jobs by code, customer, or vehicle..."]', jobCode);
  await page.waitForTimeout(500);
  
  // Click the job row
  await page.click(`tr:has-text("${jobCode}")`);
  
  // Wait for detail page
  await expect(page.locator(`h4:has-text("${jobCode}")`)).toBeVisible();
};

