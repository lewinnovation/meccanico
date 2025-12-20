import nodemailer, { Transporter } from 'nodemailer';
import { BadRequestError } from '../middleware/errorHandler';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter from environment variables
   */
  private initializeTransporter(): void {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;
    const secure = process.env.SMTP_SECURE === 'true';
    const requireTLS = process.env.SMTP_REQUIRE_TLS !== 'false';

    // Validate required environment variables
    if (!host || !port || !user || !pass || !from) {
      console.warn('SMTP configuration incomplete. Email functionality will be disabled.');
      console.warn('Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
        requireTLS,
      });

      console.log('SMTP transporter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SMTP transporter:', error);
      throw new Error('Failed to initialize email service. Please check SMTP configuration.');
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      throw new BadRequestError('SMTP is not configured. Please set SMTP environment variables.');
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP verification failed:', error);
      throw new BadRequestError('SMTP connection failed. Please check your SMTP configuration.');
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    body: string,
    attachments?: EmailAttachment[]
  ): Promise<void> {
    if (!this.transporter) {
      throw new BadRequestError('SMTP is not configured. Please set SMTP environment variables.');
    }

    const fromEmail = process.env.SMTP_FROM || 'noreply@meccanico.com';

    try {
      const mailOptions = {
        from: fromEmail,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: body,
        attachments: attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Render template with variable substitution
   */
  renderTemplate(template: string, variables: Record<string, string | number | null | undefined>): string {
    let rendered = template;

    // Replace all variables in the format {variable_name}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      const replacement = value !== null && value !== undefined ? String(value) : '';
      rendered = rendered.replace(regex, replacement);
    }

    return rendered;
  }
}
