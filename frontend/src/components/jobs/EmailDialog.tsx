import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../../utils/api';

interface EmailDialogProps {
  open: boolean;
  onClose: () => void;
  jobId: string;
  jobCode: string;
  customerEmail: string | null;
  type: 'estimate' | 'invoice';
  job?: {
    id: string;
    code: string;
    status: string;
    customer?: {
      name: string;
      email: string | null;
      phone: string | null;
    };
    vehicle?: {
      year: number | null;
      make: string | null;
      model: string | null;
      vin: string | null;
      licensePlate: string | null;
    };
    lineItems?: Array<{
      type: string;
      description: string;
      quantity: number | string;
      unitPrice: number | string;
      sortOrder?: number;
    }>;
    discountAmount?: number;
    discountPercent?: number;
    taxRate?: number;
  };
  onSuccess?: () => void;
}

export const EmailDialog: React.FC<EmailDialogProps> = ({
  open,
  onClose,
  jobId,
  jobCode,
  customerEmail,
  type,
  job,
  onSuccess,
}) => {
  const [recipientEmail, setRecipientEmail] = useState(customerEmail || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load template when dialog opens
  useEffect(() => {
    if (open) {
      setRecipientEmail(customerEmail || '');
      setError(null);
      loadTemplate();
    }
  }, [open, customerEmail, jobId, type]);

  const loadTemplate = async () => {
    setIsLoadingTemplate(true);
    let jobData: any = job;
    try {
      // Fetch the template for EMAIL_ESTIMATE or EMAIL_INVOICE action
      const templateAction = type === 'invoice' ? 'EMAIL_INVOICE' : 'EMAIL_ESTIMATE';
      const templateResponse = await api.get('/api/communication-templates', {
        params: { type: 'EMAIL' },
      });
      const templates = templateResponse.data;
      const emailTemplate = templates.find(
        (t: any) => t.action === templateAction && t.isActive
      );

      // Fetch job data if not provided
      if (!jobData) {
        const jobResponse = await api.get(`/api/jobs/${jobId}`);
        jobData = jobResponse.data;
      }

      // Fetch settings for shop information
      const settingsResponse = await api.get('/api/settings');
      const settings = settingsResponse.data;
      const shopName = (settings['shop.name']?.value as string) || 'Meccanico';
      const shopAddress = (settings['shop.address']?.value as string) || '';
      const shopPhone = (settings['shop.phone']?.value as string) || '';
      const shopEmail = (settings['shop.email']?.value as string) || '';
      const currencySymbol = (settings['currency.symbol']?.value as string) || '$';

      // Calculate totals
      const subtotal = jobData?.lineItems?.reduce((sum: number, item: any) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        return sum + quantity * unitPrice;
      }, 0) || 0;

      let discountTotal = 0;
      if (jobData?.discountPercent && jobData.discountPercent > 0) {
        discountTotal = subtotal * (jobData.discountPercent / 100);
      } else {
        discountTotal = jobData?.discountAmount || 0;
      }

      const afterDiscount = subtotal - discountTotal;
      const taxTotal = afterDiscount * ((jobData?.taxRate || 0) / 100);
      const grandTotal = afterDiscount + taxTotal;

      // Format number with thousand separators
      const formatNumber = (num: number): string => {
        return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      };

      // Format line items as HTML list
      const formatLineItemsAsHtml = (items: any[]): string => {
        if (!items || items.length === 0) {
          return '<p>No items</p>';
        }

        const sortedItems = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        let listItems = '';

        for (const item of sortedItems) {
          if (item.type === 'TEXT') {
            listItems += `<li style="font-style: italic; margin-bottom: 4px;">${item.description}</li>`;
          } else {
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unitPrice) || 0;
            const total = quantity * unitPrice;
            const quantityStr = Number.isInteger(quantity) ? quantity.toString() : quantity.toFixed(2);

            listItems += `<li style="margin-bottom: 4px;">${item.description} - Qty: ${quantityStr} @ ${currencySymbol}${formatNumber(unitPrice)} = ${currencySymbol}${formatNumber(total)}</li>`;
          }
        }

        return `<ul style="margin: 16px 0; padding-left: 20px;">${listItems}</ul>`;
      };

      // Build car information string
      const carParts: string[] = [];
      if (jobData?.vehicle?.year) carParts.push(String(jobData.vehicle.year));
      if (jobData?.vehicle?.make) carParts.push(jobData.vehicle.make);
      if (jobData?.vehicle?.model) carParts.push(jobData.vehicle.model);
      const carInformation = carParts.length > 0 ? carParts.join(' ') : 'your vehicle';

      // Build template variables
      const variables: Record<string, string> = {
        customer_name: jobData?.customer?.name || 'Customer',
        customer_email: jobData?.customer?.email || '',
        customer_phone: jobData?.customer?.phone || '',
        job_code: jobData?.code || jobCode,
        job_status: jobData?.status || '',
        vehicle_year: jobData?.vehicle?.year ? String(jobData.vehicle.year) : '',
        vehicle_make: jobData?.vehicle?.make || '',
        vehicle_model: jobData?.vehicle?.model || '',
        vehicle_vin: jobData?.vehicle?.vin || '',
        vehicle_license_plate: jobData?.vehicle?.licensePlate || '',
        rego: jobData?.vehicle?.licensePlate || '',
        car_information: carInformation,
        shop_name: shopName,
        shop_phone: shopPhone,
        shop_email: shopEmail,
        shop_address: shopAddress,
        line_items: formatLineItemsAsHtml(jobData?.lineItems || []),
        invoice_total: type === 'invoice' ? `${currencySymbol}${formatNumber(grandTotal)}` : '',
        estimate_total: type === 'estimate' ? `${currencySymbol}${formatNumber(grandTotal)}` : '',
      };

      // Render template with variables
      const renderTemplate = (template: string, vars: Record<string, string>): string => {
        let rendered = template;
        for (const [key, value] of Object.entries(vars)) {
          const regex = new RegExp(`\\{${key}\\}`, 'g');
          rendered = rendered.replace(regex, value);
        }
        return rendered;
      };

      if (emailTemplate) {
        const renderedSubject = emailTemplate.subject
          ? renderTemplate(emailTemplate.subject, variables)
          : `${type === 'invoice' ? 'Invoice' : 'Estimate'} - ${jobData?.code || jobCode}`;
        const renderedBody = renderTemplate(emailTemplate.body, variables);
        setSubject(renderedSubject);
        setMessage(renderedBody);
      } else {
        // Default template if none found
        const defaultSubject = type === 'invoice' 
          ? `Invoice for ${variables.vehicle_make || ''} ${variables.vehicle_model || ''} (${variables.rego || ''})`.trim()
          : `Estimate for ${variables.vehicle_make || ''} ${variables.vehicle_model || ''} (${variables.rego || ''})`.trim();
        const defaultBody = `<p>Hi ${variables.customer_name},</p><p>Please find attached ${type} for ${variables.car_information}.</p><p>Please do not hesitate to call us on ${variables.shop_phone}.</p><p>Thank you!</p>`;
        setSubject(defaultSubject || `${type === 'invoice' ? 'Invoice' : 'Estimate'} - ${jobData?.code || jobCode}`);
        setMessage(defaultBody);
      }
    } catch (err) {
      console.error('Failed to load template:', err);
      // Use default template with basic info
      const defaultSubject = `${type === 'invoice' ? 'Invoice' : 'Estimate'} - ${jobCode}`;
      const customerName = job?.customer?.name || jobData?.customer?.name || 'Customer';
      const defaultBody = `Hi ${customerName},\n\nPlease find attached ${type}.\n\nThank you!`;
      setSubject(defaultSubject);
      setMessage(defaultBody);
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handleSend = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Send the rendered message (which already has variables replaced)
      // The backend will use customMessage if provided, otherwise it will render the template again
      await api.post(`/api/jobs/${jobId}/email`, {
        type,
        recipientEmail,
        customMessage: message, // Send the rendered message
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quillRef = useRef<ReactQuill>(null);

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon />
          <span>Send {type === 'invoice' ? 'Invoice' : 'Estimate'} via Email</span>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          This email will include a PDF attachment of the {type === 'invoice' ? 'invoice' : 'estimate'}.
        </Alert>

        {isLoadingTemplate ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TextField
              label="Recipient Email"
              type="email"
              fullWidth
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              margin="normal"
              required
              disabled={isLoading}
            />

            <TextField
              label="Subject"
              fullWidth
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              margin="normal"
              disabled={isLoading}
            />

            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Message
              </Typography>
              <Box sx={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px' }}>
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={message}
                  onChange={setMessage}
                  modules={quillModules}
                  readOnly={isLoading}
                  placeholder="Enter your message here. Use variables like {customer_name}, {car_information}, etc."
                  style={{ minHeight: '200px' }}
                />
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={16} /> : <EmailIcon />}
          disabled={isLoading || isLoadingTemplate || !recipientEmail}
        >
          {isLoading ? 'Sending...' : 'Send Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
