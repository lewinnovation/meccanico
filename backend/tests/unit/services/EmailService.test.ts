import { EmailService } from '../../../src/services/EmailService';
import { BadRequestError } from '../../../src/middleware/errorHandler';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');

describe('EmailService', () => {
  let emailService: EmailService;
  let mockTransporter: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };

    // Setup mock transporter
    mockTransporter = {
      verify: jest.fn().mockResolvedValue(true),
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'test-message-id',
        accepted: ['test@example.com'],
        rejected: [],
      }),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize transporter with valid SMTP config', () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '2525';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'test-password';
      process.env.SMTP_FROM = 'test@example.com';
      process.env.SMTP_SECURE = 'false';
      process.env.SMTP_REQUIRE_TLS = 'true';

      emailService = new EmailService();

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 2525,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'test-password',
        },
        requireTLS: true,
      });
    });

    it('should handle missing SMTP config gracefully', () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      delete process.env.SMTP_FROM;

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      emailService = new EmailService();

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(nodemailer.createTransport).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should use default values for optional SMTP settings', () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '2525';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'test-password';
      process.env.SMTP_FROM = 'test@example.com';
      // Don't set SMTP_SECURE or SMTP_REQUIRE_TLS

      emailService = new EmailService();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          secure: false, // default
          requireTLS: true, // default
        })
      );
    });
  });

  describe('verifyConnection', () => {
    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '2525';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'test-password';
      process.env.SMTP_FROM = 'test@example.com';
      emailService = new EmailService();
    });

    it('should verify SMTP connection successfully', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await emailService.verifyConnection();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should throw error if SMTP is not configured', async () => {
      // Create service without SMTP config
      delete process.env.SMTP_HOST;
      const serviceWithoutConfig = new EmailService();

      await expect(serviceWithoutConfig.verifyConnection()).rejects.toThrow(
        BadRequestError
      );
    });

    it('should throw error if verification fails', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      await expect(emailService.verifyConnection()).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '2525';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'test-password';
      process.env.SMTP_FROM = 'test@example.com';
      emailService = new EmailService();
    });

    it('should send email successfully', async () => {
      const to = 'info@lewinnovation.com';
      const subject = 'Test Subject';
      const body = '<p>Test Body</p>';

      await emailService.sendEmail(to, subject, body);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'info@lewinnovation.com',
        subject: 'Test Subject',
        html: '<p>Test Body</p>',
        attachments: undefined,
      });
    });

    it('should send email to multiple recipients', async () => {
      const to = ['info@lewinnovation.com', 'test@example.com'];
      const subject = 'Test Subject';
      const body = '<p>Test Body</p>';

      await emailService.sendEmail(to, subject, body);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'info@lewinnovation.com, test@example.com',
        })
      );
    });

    it('should send email with attachments', async () => {
      const to = 'info@lewinnovation.com';
      const subject = 'Test Subject';
      const body = '<p>Test Body</p>';
      const attachments = [
        {
          filename: 'test.pdf',
          content: Buffer.from('test content'),
          contentType: 'application/pdf',
        },
      ];

      await emailService.sendEmail(to, subject, body, attachments);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            {
              filename: 'test.pdf',
              content: Buffer.from('test content'),
              contentType: 'application/pdf',
            },
          ],
        })
      );
    });

    it('should throw error if SMTP is not configured', async () => {
      // Temporarily remove SMTP config
      const originalHost = process.env.SMTP_HOST;
      delete process.env.SMTP_HOST;
      
      const serviceWithoutConfig = new EmailService();

      await expect(
        serviceWithoutConfig.sendEmail(
          'info@lewinnovation.com',
          'Test',
          'Body'
        )
      ).rejects.toThrow(BadRequestError);
      
      // Restore config
      if (originalHost) {
        process.env.SMTP_HOST = originalHost;
      }
    });

    it('should throw error if sendMail fails', async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error('SMTP send failed')
      );

      await expect(
        emailService.sendEmail(
          'info@lewinnovation.com',
          'Test',
          'Body'
        )
      ).rejects.toThrow('Failed to send email');
    });
  });

  describe('renderTemplate', () => {
    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '2525';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'test-password';
      process.env.SMTP_FROM = 'test@example.com';
      emailService = new EmailService();
    });

    it('should replace template variables correctly', () => {
      const template = 'Hi {customer_name}, your {car_information} is ready.';
      const variables = {
        customer_name: 'John Doe',
        car_information: '2020 Toyota Camry',
      };

      const result = emailService.renderTemplate(template, variables);

      expect(result).toBe('Hi John Doe, your 2020 Toyota Camry is ready.');
    });

    it('should handle multiple occurrences of same variable', () => {
      const template = '{customer_name} - {customer_name} - {customer_name}';
      const variables = {
        customer_name: 'John Doe',
      };

      const result = emailService.renderTemplate(template, variables);

      expect(result).toBe('John Doe - John Doe - John Doe');
    });

    it('should leave missing variables as-is (not replace)', () => {
      const template = 'Hi {customer_name}, your {car_information} is ready.';
      const variables = {
        customer_name: 'John Doe',
        // car_information is missing - should remain as {car_information}
      };

      const result = emailService.renderTemplate(template, variables);

      // Missing variables are not replaced, they remain in the template
      expect(result).toBe('Hi John Doe, your {car_information} is ready.');
    });

    it('should handle null and undefined values', () => {
      const template = 'Hi {customer_name}, phone: {customer_phone}';
      const variables = {
        customer_name: 'John Doe',
        customer_phone: null as any,
      };

      const result = emailService.renderTemplate(template, variables);

      expect(result).toBe('Hi John Doe, phone: ');
    });

    it('should handle numeric values', () => {
      const template = 'Total: {invoice_total}';
      const variables = {
        invoice_total: 123.45,
      };

      const result = emailService.renderTemplate(template, variables);

      expect(result).toBe('Total: 123.45');
    });
  });
});
