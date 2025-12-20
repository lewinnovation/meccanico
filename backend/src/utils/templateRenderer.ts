import { Job } from '../models/Job';
import { Customer } from '../models/Customer';
import { Vehicle } from '../models/Vehicle';
import { SettingsService } from '../services/SettingsService';
import { LineItem, LineItemType } from '../models/LineItem';

export interface TemplateVariables {
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  job_code: string;
  job_status: string;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_vin: string | null;
  vehicle_license_plate: string | null;
  rego: string | null;
  car_information: string;
  shop_name: string;
  shop_phone: string;
  shop_email: string;
  shop_address: string;
  line_items: string;
  invoice_total?: string;
  estimate_total?: string;
}

/**
 * Format number with thousand separators
 */
function formatNumberWithSeparators(num: number): string {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format line items as HTML table
 */
export function formatLineItemsAsHtml(
  lineItems: LineItem[] | undefined,
  currencySymbol: string = '$'
): string {
  if (!lineItems || lineItems.length === 0) {
    return '<p>No items</p>';
  }

  // Sort by sortOrder
  const sortedItems = [...lineItems].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  let tableRows = '';
  for (const item of sortedItems) {
    if (item.type === LineItemType.TEXT) {
      tableRows += `
        <tr style="background-color: #f5f5f5;">
          <td colspan="4" style="padding: 8px; font-style: italic;">${item.description}</td>
        </tr>
      `;
    } else {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const total = quantity * unitPrice;

      tableRows += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${Number.isInteger(quantity) ? quantity : quantity.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${currencySymbol}${formatNumberWithSeparators(unitPrice)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${currencySymbol}${formatNumberWithSeparators(total)}</td>
        </tr>
      `;
    }
  }

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Description</th>
          <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Qty</th>
          <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
          <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
}

/**
 * Extract all template variables from a template string
 */
export function extractTemplateVariables(template: string): string[] {
  const regex = /\{(\w+)\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Build template variables from Job context
 */
export async function buildTemplateVariables(
  job: Job,
  settingsService: SettingsService,
  type: 'estimate' | 'invoice' = 'estimate'
): Promise<TemplateVariables> {
  // Get shop settings
  const shopName = ((await settingsService.findByKey('shop.name')).value as string) || 'Meccanico';
  const shopAddress = ((await settingsService.findByKey('shop.address')).value as string) || '';
  const shopPhone = ((await settingsService.findByKey('shop.phone')).value as string) || '';
  const shopEmail = ((await settingsService.findByKey('shop.email')).value as string) || '';

  // Calculate totals
  const subtotal = job.lineItems?.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0) || 0;

  let discountTotal = 0;
  if (job.discountPercent > 0) {
    discountTotal = subtotal * (job.discountPercent / 100);
  } else {
    discountTotal = job.discountAmount || 0;
  }

  const afterDiscount = subtotal - discountTotal;
  const taxTotal = afterDiscount * (job.taxRate / 100);
  const grandTotal = afterDiscount + taxTotal;

  const currencySymbol = ((await settingsService.findByKey('currency.symbol')).value as string) || '$';

  // Build car information string
  const carParts: string[] = [];
  if (job.vehicle?.year) carParts.push(String(job.vehicle.year));
  if (job.vehicle?.make) carParts.push(job.vehicle.make);
  if (job.vehicle?.model) carParts.push(job.vehicle.model);
  const carInformation = carParts.length > 0 ? carParts.join(' ') : 'your vehicle';

  // Format totals with thousand separators
  const formattedGrandTotal = formatNumberWithSeparators(grandTotal);

  // Format line items as HTML
  const lineItemsHtml = formatLineItemsAsHtml(job.lineItems, currencySymbol);

  return {
    customer_name: job.customer?.name || 'Customer',
    customer_email: job.customer?.email || null,
    customer_phone: job.customer?.phone || null,
    job_code: job.code,
    job_status: job.status,
    vehicle_year: job.vehicle?.year?.toString() || null,
    vehicle_make: job.vehicle?.make || null,
    vehicle_model: job.vehicle?.model || null,
    vehicle_vin: job.vehicle?.vin || null,
    vehicle_license_plate: job.vehicle?.licensePlate || null,
    rego: job.vehicle?.licensePlate || null,
    car_information: carInformation,
    shop_name: shopName,
    shop_phone: shopPhone,
    shop_email: shopEmail,
    shop_address: shopAddress,
    line_items: lineItemsHtml,
    invoice_total: type === 'invoice' ? `${currencySymbol}${formattedGrandTotal}` : undefined,
    estimate_total: type === 'estimate' ? `${currencySymbol}${formattedGrandTotal}` : undefined,
  };
}

/**
 * Render template with variable substitution
 */
export function renderTemplate(template: string, variables: TemplateVariables): string {
  let rendered = template;

  // Replace all variables in the format {variable_name}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    const replacement = value !== null && value !== undefined ? String(value) : '';
    rendered = rendered.replace(regex, replacement);
  }

  return rendered;
}

/**
 * Get list of available template variables with descriptions
 */
export function getAvailableTemplateVariables(): Array<{ key: string; description: string }> {
  return [
    { key: 'customer_name', description: 'Customer full name' },
    { key: 'customer_email', description: 'Customer email address' },
    { key: 'customer_phone', description: 'Customer phone number' },
    { key: 'job_code', description: 'Job code (e.g., J251219005)' },
    { key: 'job_status', description: 'Current job status' },
    { key: 'vehicle_year', description: 'Vehicle year' },
    { key: 'vehicle_make', description: 'Vehicle make/brand' },
    { key: 'vehicle_model', description: 'Vehicle model' },
    { key: 'vehicle_vin', description: 'Vehicle VIN number' },
    { key: 'vehicle_license_plate', description: 'Vehicle license plate' },
    { key: 'rego', description: 'Vehicle license plate (alias for vehicle_license_plate)' },
    { key: 'car_information', description: 'Formatted car info (e.g., "2020 Toyota Camry")' },
    { key: 'shop_name', description: 'Shop name' },
    { key: 'shop_phone', description: 'Shop phone number' },
    { key: 'shop_email', description: 'Shop email address' },
    { key: 'shop_address', description: 'Shop address' },
    { key: 'line_items', description: 'Formatted HTML table of job line items' },
    { key: 'invoice_total', description: 'Invoice total amount with thousand separators (for invoices only)' },
    { key: 'estimate_total', description: 'Estimate total amount with thousand separators (for estimates only)' },
  ];
}
