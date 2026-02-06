import { Resend } from 'resend';

// Lazy initialization to avoid build errors when API key is not set
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

const EMAIL_FROM = process.env.EMAIL_FROM || 'TrySumo <onboarding@resend.dev>';

export async function sendOTPEmail(
  email: string,
  otp: string,
  name: string
): Promise<boolean> {
  try {
    const client = getResendClient();
    const { error } = await client.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Verify your TrySumo account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
            <div style="max-width: 420px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #18181b; font-size: 24px; margin: 0 0 8px; text-align: center;">Welcome to TrySumo!</h1>
              <p style="color: #71717a; font-size: 14px; margin: 0 0 32px; text-align: center;">Hi ${name}, verify your email to get started</p>

              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your verification code</p>
                <p style="color: white; font-size: 36px; font-weight: bold; margin: 0; letter-spacing: 8px;">${otp}</p>
              </div>

              <p style="color: #71717a; font-size: 13px; text-align: center; margin: 0 0 8px;">This code expires in <strong>10 minutes</strong></p>
              <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">If you didn't create an account, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send OTP email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  try {
    const client = getResendClient();
    const { error } = await client.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Welcome to TrySumo!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
            <div style="max-width: 420px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #18181b; font-size: 24px; margin: 0 0 8px; text-align: center;">You're all set!</h1>
              <p style="color: #71717a; font-size: 14px; margin: 0 0 24px; text-align: center;">Hi ${name}, your account is now verified</p>

              <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Thanks for joining TrySumo! You now have access to all our games, AI agents, and productivity tools.
              </p>

              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://trysumo.app'}" style="display: block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 600; text-align: center;">
                Start Exploring
              </a>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}
