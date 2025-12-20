/**
 * Integration tests for email functionality
 * These tests actually send emails to info@lewinnovation.com
 * Run with: npm test -- email.test.ts
 */

import { EmailService } from '../../src/services/EmailService';
import { CommunicationTemplateService } from '../../src/services/CommunicationTemplateService';
import { JobService } from '../../src/services/JobService';
import { SettingsService } from '../../src/services/SettingsService';
import { AppDataSource } from '../../src/config/database';
import {
  CommunicationTemplate,
  CommunicationTemplateType,
  CommunicationTemplateAction,
} from '../../src/models/CommunicationTemplate';
import { buildTemplateVariables, renderTemplate } from '../../src/utils/templateRenderer';
import { Job } from '../../src/models/Job';
import { Customer } from '../../src/models/Customer';
import { Vehicle } from '../../src/models/Vehicle';

// Only run integration tests if explicitly requested
const RUN_INTEGRATION_TESTS = process.env.RUN_INTEGRATION_TESTS === 'true';

describe('Email Integration Tests', () => {
  let emailService: EmailService;
  let templateService: CommunicationTemplateService;
  let jobService: JobService;
  let settingsService: SettingsService;

  beforeAll(async () => {
    if (!RUN_INTEGRATION_TESTS) {
      console.log('Skipping integration tests. Set RUN_INTEGRATION_TESTS=true to run.');
      return;
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    emailService = new EmailService();
    templateService = new CommunicationTemplateService();
    jobService = new JobService();
    settingsService = new SettingsService();
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('SMTP Connection', () => {
    it('should verify SMTP connection', async () => {
      if (!RUN_INTEGRATION_TESTS) {
        return;
      }

      const isConnected = await emailService.verifyConnection();
      expect(isConnected).toBe(true);
    }, 30000); // 30 second timeout for SMTP connection
  });

  describe('Send Test Email', () => {
    it('should send a simple test email to info@lewinnovation.com', async () => {
      if (!RUN_INTEGRATION_TESTS) {
        return;
      }

      const subject = `[TEST] Email Service Test - ${new Date().toISOString()}`;
      const body = `
        <h2>Email Service Integration Test</h2>
        <p>This is a test email sent from the Meccanico email service integration tests.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>If you received this email, the SMTP configuration is working correctly!</p>
      `;

      await expect(
        emailService.sendEmail('info@lewinnovation.com', subject, body)
      ).resolves.not.toThrow();
    }, 30000);
  });

  describe('Send Email with PDF Attachment', () => {
    it('should send email with PDF attachment to info@lewinnovation.com', async () => {
      if (!RUN_INTEGRATION_TESTS) {
        return;
      }

      // Create a test PDF buffer
      const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF');
      
      const subject = `[TEST] PDF Attachment Test - ${new Date().toISOString()}`;
      const body = `
        <h2>PDF Attachment Test</h2>
        <p>This email contains a test PDF attachment.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `;

      const attachments = [
        {
          filename: `test-attachment-${Date.now()}.pdf`,
          content: pdfContent,
          contentType: 'application/pdf',
        },
      ];

      await expect(
        emailService.sendEmail(
          'info@lewinnovation.com',
          subject,
          body,
          attachments
        )
      ).resolves.not.toThrow();
    }, 30000);
  });

  describe('Template Rendering and Email', () => {
    it('should render template and send email to info@lewinnovation.com', async () => {
      if (!RUN_INTEGRATION_TESTS) {
        return;
      }

      // Create a test template
      const template = `
        Hi {customer_name},
        
        This is a test email for your {car_information}.
        
        Job Code: {job_code}
        Shop: {shop_name}
        Phone: {shop_phone}
        
        Thank you!
      `;

      const variables = {
        customer_name: 'Test Customer',
        car_information: '2020 Toyota Camry',
        job_code: 'TEST001',
        shop_name: 'Meccanico Test Shop',
        shop_phone: '+61 2 1234 5678',
        customer_email: 'info@lewinnovation.com',
        customer_phone: '+61 400 000 000',
        job_status: 'COMPLETED',
        vehicle_year: '2020',
        vehicle_make: 'Toyota',
        vehicle_model: 'Camry',
        vehicle_vin: null,
        vehicle_license_plate: 'TEST123',
        shop_email: 'hello@lwylabs.dev',
        shop_address: '123 Test Street',
        invoice_total: '$150.00',
        estimate_total: undefined,
      };

      const rendered = renderTemplate(template, variables);
      const subject = `[TEST] Template Rendering Test - ${new Date().toISOString()}`;

      await expect(
        emailService.sendEmail('info@lewinnovation.com', subject, rendered)
      ).resolves.not.toThrow();
    }, 30000);
  });

  describe('End-to-End: Job Email with Template', () => {
    it('should fetch job, render template, generate PDF, and send email', async () => {
      if (!RUN_INTEGRATION_TESTS) {
        return;
      }

      // Find a test job (or create one)
      const jobRepository = AppDataSource.getRepository(Job);
      const jobs = await jobRepository.find({
        take: 1,
        relations: ['customer', 'vehicle'],
      });

      if (jobs.length === 0) {
        console.log('No jobs found in database. Skipping end-to-end test.');
        return;
      }

      const job = jobs[0];

      // Determine type based on whether job has invoice
      const emailType: 'estimate' | 'invoice' = job.invoiceId ? 'invoice' : 'estimate';

      // Get or create email template
      const templateAction = emailType === 'invoice' 
        ? CommunicationTemplateAction.EMAIL_INVOICE 
        : CommunicationTemplateAction.EMAIL_ESTIMATE;
      
      let template = await templateService.findByActionAndType(
        templateAction,
        CommunicationTemplateType.EMAIL
      );

      if (!template) {
        // Create a test template
        template = await templateService.create({
          name: `Test Email ${emailType === 'invoice' ? 'Invoice' : 'Estimate'} Template`,
          type: CommunicationTemplateType.EMAIL,
          action: templateAction,
          subject: emailType === 'invoice' 
            ? '[TEST] Invoice for {vehicle_make} {vehicle_model} ({rego})'
            : '[TEST] Estimate for {vehicle_make} {vehicle_model} ({rego})',
          body: emailType === 'invoice'
            ? `
            <p>Hi {customer_name},</p>
            <p>Please find attached your invoice for {car_information}.</p>
            <p><strong>Job Code:</strong> {job_code}</p>
            {line_items}
            <p><strong>Total amount due:</strong> {invoice_total}</p>
            <p>This is a test email from the integration tests.</p>
            <p>Best regards,<br>{shop_name}</p>
          `
            : `
            <p>Hi {customer_name},</p>
            <p>Please find attached your estimate for {car_information}.</p>
            <p><strong>Job Code:</strong> {job_code}</p>
            {line_items}
            <p><strong>Estimate Total:</strong> {estimate_total}</p>
            <p><em>This is an estimate and does not require payment.</em></p>
            <p>This is a test email from the integration tests.</p>
            <p>Best regards,<br>{shop_name}</p>
          `,
          isActive: true,
        });
      }

      // Build template variables
      const variables = await buildTemplateVariables(
        job,
        settingsService,
        emailType
      );

      // Render template
      const subject = template.subject
        ? renderTemplate(template.subject, variables)
        : `[TEST] ${emailType === 'invoice' ? 'Invoice' : 'Estimate'} - ${job.code}`;
      const body = renderTemplate(template.body, variables);

      // Generate PDF
      const pdfBuffer = await jobService.generatePdf(job.id, emailType);
      const filename = `test-${emailType}-${job.code}.pdf`;

      // Send email
      await expect(
        emailService.sendEmail(
          'info@lewinnovation.com',
          `[TEST] ${subject}`,
          body,
          [
            {
              filename,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ]
        )
      ).resolves.not.toThrow();
    }, 60000); // 60 second timeout for full end-to-end test
  });
});
