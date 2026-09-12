import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Resend } from 'resend';
import { metrics } from '../observability/metrics.js';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  send(input: SendEmailInput): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  async send(input: SendEmailInput): Promise<void> {
    logger.info(
      {
        to: input.to,
        subject: input.subject,
        text: input.text ?? input.html.slice(0, 800),
      },
      'Console email provider: message ready (not delivered to a real inbox)',
    );
    metrics.incr('email.sent');
  }
}

class ResendEmailProvider implements EmailProvider {
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(input: SendEmailInput): Promise<void> {
    const result = await this.client.emails.send({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (result.error) {
      metrics.incr('email.failures');
      throw new Error(result.error.message || 'Resend send failed');
    }
    metrics.incr('email.sent');
  }
}

function createProvider(): EmailProvider {
  if (env.EMAIL_PROVIDER === 'resend' && env.EMAIL_API_KEY) {
    return new ResendEmailProvider(env.EMAIL_API_KEY);
  }
  return new ConsoleEmailProvider();
}

export const emailProvider = createProvider();

export const emailTemplates = {
  invitation(params: {
    workspaceName: string;
    inviterName: string;
    role: string;
    inviteUrl: string;
    expiresAt: Date;
  }): { subject: string; html: string; text: string } {
    const subject = `You're invited to join ${params.workspaceName} on WorkSpace`;
    const text = `${params.inviterName} invited you to ${params.workspaceName} as ${params.role}. Accept: ${params.inviteUrl} (expires ${params.expiresAt.toISOString()})`;
    const html = `<p><strong>${params.inviterName}</strong> invited you to <strong>${params.workspaceName}</strong> as <strong>${params.role}</strong>.</p><p><a href="${params.inviteUrl}">Accept invitation</a></p><p>Expires: ${params.expiresAt.toUTCString()}</p>`;
    return { subject, html, text };
  },

  welcome(params: { name: string; appUrl: string }): { subject: string; html: string; text: string } {
    const subject = 'Welcome to WorkSpace';
    const text = `Hi ${params.name}, welcome to WorkSpace. Get started: ${params.appUrl}`;
    const html = `<p>Hi ${params.name},</p><p>Welcome to WorkSpace. <a href="${params.appUrl}">Open the app</a> to create your first workspace.</p>`;
    return { subject, html, text };
  },

  passwordReset(params: { resetUrl: string; expiresAt: Date }): {
    subject: string;
    html: string;
    text: string;
  } {
    const subject = 'Reset your WorkSpace password';
    const text = `Reset your password: ${params.resetUrl} (expires ${params.expiresAt.toISOString()})`;
    const html = `<p>Reset your password by clicking <a href="${params.resetUrl}">this link</a>.</p><p>Expires: ${params.expiresAt.toUTCString()}</p><p>If you did not request this, ignore this email.</p>`;
    return { subject, html, text };
  },
};

export async function sendEmail(input: SendEmailInput): Promise<void> {
  await emailProvider.send(input);
}
