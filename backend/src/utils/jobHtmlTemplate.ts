import { Job } from '../models/Job';
import { Invoice } from '../models/Invoice';
import { SettingsService } from '../services/SettingsService';

export interface JobHtmlTemplateData {
  job: Job;
  invoice?: Invoice | null;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  invoiceTerms: string;
  invoiceFooter: string;
  currencySymbol: string;
  taxName: string;
  type: 'estimate' | 'invoice';
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
}

/**
 * Build HTML template for job estimate or invoice
 */
export function buildJobHtmlTemplate(data: JobHtmlTemplateData): string {
  const {
    job,
    invoice,
    shopName,
    shopAddress,
    shopPhone,
    shopEmail,
    invoiceTerms,
    invoiceFooter,
    currencySymbol,
    taxName,
    type,
    subtotal,
    discountTotal,
    taxTotal,
    grandTotal,
  } = data;

  const title = type === 'estimate' ? 'Estimate' : 'Invoice';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${job.code}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .shop-info h1 { font-size: 24px; color: #1976d2; margin-bottom: 8px; }
          .shop-info p { font-size: 12px; color: #666; }
          .document-info { text-align: right; }
          .document-info h2 { font-size: 28px; color: ${type === 'estimate' ? '#1976d2' : '#2e7d32'}; margin-bottom: 8px; }
          .document-info p { font-size: 14px; }
          .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .customer-info, .vehicle-info { width: 48%; }
          .customer-info h3, .vehicle-info h3 { font-size: 14px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
          .customer-info p, .vehicle-info p { font-size: 14px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f5f5f5; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #ddd; }
          td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
          .text-right { text-align: right; }
          .text-row td { background: transparent; font-style: italic; color: #666; }
          .totals { margin-left: auto; width: 300px; }
          .totals .row { display: flex; justify-content: space-between; padding: 8px 0; }
          .totals .row.total { border-top: 2px solid #333; font-weight: bold; font-size: 18px; margin-top: 8px; padding-top: 16px; }
          .totals .row.discount { color: #2e7d32; }
          .totals .row.tax { color: #666; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
          .terms { font-size: 12px; color: #666; margin-bottom: 20px; }
          .terms h4 { margin-bottom: 8px; }
          .footer-text { font-size: 12px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-info">
            <h1>${shopName}</h1>
            <p>${shopAddress}</p>
            <p>${shopPhone}</p>
            <p>${shopEmail}</p>
          </div>
          <div class="document-info">
            <h2>${title}</h2>
            <p><strong>${job.code}</strong></p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
            ${type === 'invoice' && invoice ? `<p>Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>` : ''}
          </div>
        </div>

        <div class="details">
          <div class="customer-info">
            <h3>Bill To</h3>
            <p><strong>${job.customer?.name || 'N/A'}</strong></p>
            <p>${job.customer?.phone || ''}</p>
            <p>${job.customer?.email || ''}</p>
          </div>
          <div class="vehicle-info">
            <h3>Vehicle</h3>
            <p><strong>${job.vehicle?.year || ''} ${job.vehicle?.make || ''} ${job.vehicle?.model || ''}</strong></p>
            ${job.vehicle?.licensePlate ? `<p>License: ${job.vehicle.licensePlate}</p>` : ''}
            ${job.vehicle?.vin ? `<p>VIN: ${job.vehicle.vin}</p>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${job.lineItems?.map((item) => {
              if (item.type === 'TEXT') {
                return `
              <tr class="text-row">
                <td colspan="4">${item.description}</td>
              </tr>
            `;
              }
              
              // Ensure quantity and unitPrice are numbers
              const quantity = Number(item.quantity) || 0;
              const unitPrice = Number(item.unitPrice) || 0;
              const total = quantity * unitPrice;
              
              return `
              <tr>
                <td>${item.description}</td>
                <td class="text-right">${Number.isInteger(quantity) ? quantity : quantity.toFixed(2)}</td>
                <td class="text-right">${currencySymbol}${unitPrice.toFixed(2)}</td>
                <td class="text-right">${currencySymbol}${total.toFixed(2)}</td>
              </tr>
            `;
            }).join('') || '<tr><td colspan="4">No items</td></tr>'}
          </tbody>
        </table>

        <div class="totals">
          <div class="row">
            <span>Subtotal</span>
            <span>${currencySymbol}${subtotal.toFixed(2)}</span>
          </div>
          ${discountTotal > 0 ? `
            <div class="row discount">
              <span>Discount${job.discountPercent && job.discountPercent > 0 ? ` (${job.discountPercent}%)` : ''}</span>
              <span>-${currencySymbol}${discountTotal.toFixed(2)}</span>
            </div>
          ` : ''}
          ${job.taxRate && job.taxRate > 0 ? `
            <div class="row tax">
              <span>${taxName} (${job.taxRate}%)</span>
              <span>${currencySymbol}${taxTotal.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="row total">
            <span>Total</span>
            <span>${currencySymbol}${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        ${job.notes ? `
          <div class="footer">
            <div class="terms">
              <h4>Notes</h4>
              <p>${job.notes}</p>
            </div>
          </div>
        ` : ''}

        ${invoiceTerms || invoiceFooter ? `
          <div class="footer">
            ${invoiceTerms ? `
              <div class="terms">
                <h4>Terms & Conditions</h4>
                <p>${invoiceTerms}</p>
              </div>
            ` : ''}
            ${invoiceFooter ? `
              <div class="footer-text">${invoiceFooter}</div>
            ` : ''}
          </div>
        ` : ''}
      </body>
    </html>
  `;
}


