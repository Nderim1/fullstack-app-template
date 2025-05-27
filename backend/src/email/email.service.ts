import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Mail | null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('POSTAL_SMTP_HOST');
    const port = this.configService.get<number>('POSTAL_SMTP_PORT');
    const user = this.configService.get<string>('POSTAL_SMTP_USER');
    const pass = this.configService.get<string>('POSTAL_SMTP_PASS');

    if (!host || !port || !user || !pass) {
      this.logger.warn(
        'Postal SMTP environment variables are not fully configured. Email sending will be disabled.',
      );
      // You could implement a mock transporter or disable sending if not configured
      this.transporter = null;
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
        // Optional: Add connection timeout and other settings
        // connectionTimeout: 5000,
        // greetingTimeout: 5000,
        // socketTimeout: 5000,
      });

      this.transporter.verify((error) => {
        if (error) {
          this.logger.error('SMTP Connection Error:', error);
        } else {
          this.logger.log('SMTP Server is ready to take messages');
        }
      });
    }
  }

  async sendMail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.error(
        `Email not sent to ${to} with subject "${subject}" because SMTP is not configured.`,
      );
      // In a real app, you might throw an error or handle this more gracefully
      // For this template, we'll just log and not send if not configured.
      // throw new InternalServerErrorException('Email service is not configured.');
      return;
    }

    const senderEmail = this.configService.get<string>('POSTAL_SENDER_EMAIL');
    if (!senderEmail) {
      this.logger.error(
        'POSTAL_SENDER_EMAIL is not configured. Cannot send email.',
      );
      return;
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Your App Name" <${senderEmail}>`, // Customize your app name and sender
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ''), // Basic text version from HTML
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${error.message}`,
        error.stack,
      );
      // Depending on the error, you might want to retry or notify an admin
      throw error; // Re-throw to be handled by the calling service
    }
  }

  async sendMagicLinkEmail(to: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const magicLink = `${frontendUrl}/auth/verify-magic-link?token=${token}`;

    const subject = 'Your Magic Link Login for Our Awesome App';
    const html = `
      <p>Hello,</p>
      <p>Click the link below to log in to your account:</p>
      <p><a href="${magicLink}">Log In with Magic Link</a></p>
      <p>This link will expire in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <p>Thanks,<br/>The Awesome App Team</p>
    `;
    // const text = `Hello,\n\nClick the link below to log in to your account:\n${magicLink}\n\nThis link will expire in 15 minutes.\nIf you did not request this, please ignore this email.\n\nThanks,\nThe Awesome App Team`;

    await this.sendMail(to, subject, html);
  }
}
