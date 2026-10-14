import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;

    if (!host || !user || !password) {
      console.warn(
        '⚠️ SMTP configuration not found. Email notifications are disabled.',
      );

      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });

      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass: password,
      },
    });

    console.log('✅ Email service initialized');
  }

  async sendVerificationOtp(
    email: string,
    name: string,
    otp: string,
  ) {
    try {
      console.log(`\n========================================`);
      console.log(`🔑 EMAIL VERIFICATION CODE FOR ${email}: [ ${otp} ]`);
      console.log(`========================================\n`);

      const from =
        process.env.SMTP_FROM ||
        process.env.SMTP_USER ||
        'no-reply@intervai.com';

      await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Verify Your IntervAI Account - Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
            <title>IntervAI Email Verification</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; margin: 0; padding: 40px 20px;">
            <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
              <div style="background: #4f46e5; padding: 25px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Interv<span style="color: #a5b4fc;">AI</span></h1>
              </div>
              <div style="padding: 35px 30px; color: #374151;">
                <h2 style="color: #111827; font-size: 20px; margin-top: 0;">Verify Your Email Address</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
                  Hello <strong>${name}</strong>,
                </p>
                <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
                  Welcome to IntervAI! Use the 6-digit verification code below to verify your email address and activate your interview-ready account.
                </p>
                <div style="margin: 30px 0; text-align: center;">
                  <div style="display: inline-block; background: #eef2ff; border: 2px dashed #4f46e5; border-radius: 10px; padding: 15px 35px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5;">
                    ${otp}
                  </div>
                </div>
                <p style="font-size: 13px; color: #6b7280; text-align: center;">
                  This code expires in <strong>15 minutes</strong>. If you did not create an account, you can safely ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 25px 0;" />
                <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 0;">
                  © ${new Date().getFullYear()} IntervAI. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log(`📧 Verification email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      return false;
    }
  }

  async sendPasswordResetOtp(
    email: string,
    name: string,
    otp: string,
  ) {
    try {
      console.log(`\n========================================`);
      console.log(`🔑 PASSWORD RESET CODE FOR ${email}: [ ${otp} ]`);
      console.log(`========================================\n`);

      const from =
        process.env.SMTP_FROM ||
        process.env.SMTP_USER ||
        'no-reply@intervai.com';

      await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Reset Your IntervAI Password - Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
            <title>IntervAI Password Reset</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; margin: 0; padding: 40px 20px;">
            <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
              <div style="background: #4f46e5; padding: 25px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Interv<span style="color: #a5b4fc;">AI</span></h1>
              </div>
              <div style="padding: 35px 30px; color: #374151;">
                <h2 style="color: #111827; font-size: 20px; margin-top: 0;">Password Reset Request</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
                  Hello <strong>${name}</strong>,
                </p>
                <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
                  We received a request to reset your password for your IntervAI account. Use the 6-digit code below to set a new password:
                </p>
                <div style="margin: 30px 0; text-align: center;">
                  <div style="display: inline-block; background: #fee2e2; border: 2px dashed #ef4444; border-radius: 10px; padding: 15px 35px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #dc2626;">
                    ${otp}
                  </div>
                </div>
                <p style="font-size: 13px; color: #6b7280; text-align: center;">
                  This code expires in <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 25px 0;" />
                <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 0;">
                  © ${new Date().getFullYear()} IntervAI. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log(`📧 Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return false;
    }
  }

  async sendInterviewCompletedEmail(
    email: string,
    name: string,
    role: string,
    score: number,
  ) {
    try {
      const from =
        process.env.SMTP_FROM ||
        process.env.SMTP_USER;

      await this.transporter.sendMail({
        from,
        to: email,

        subject:
          'Your IntervAI Interview Report is Ready 🎯',

        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
            <title>IntervAI Interview Report</title>
          </head>

          <body
            style="
              font-family: Arial, sans-serif;
              background: #f4f4f4;
              padding: 30px;
            "
          >

            <div
              style="
                max-width: 600px;
                margin: auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
              "
            >

              <h1 style="color: #333;">
                Interview Completed 🎉
              </h1>

              <p>
                Hi ${name},
              </p>

              <p>
                Your IntervAI interview has been completed
                successfully.
              </p>

              <h2>
                Interview Details
              </h2>

              <p>
                <strong>Role:</strong>
                ${role}
              </p>

              <p>
                <strong>Overall Score:</strong>
                ${score}
              </p>

              <p>
                Your AI-generated interview report is now
                available in your IntervAI dashboard.
              </p>

              <hr />

              <p>
                Keep practicing and improve your interview
                performance 🚀
              </p>

              <p>
                <strong>IntervAI</strong>
              </p>

            </div>

          </body>
          </html>
        `,
      });

      console.log(
        `📧 Interview completion email sent to ${email}`,
      );

      return true;
    } catch (error) {
      console.error(
        '❌ Failed to send interview completion email',
        error,
      );

      return false;
    }
  }
}