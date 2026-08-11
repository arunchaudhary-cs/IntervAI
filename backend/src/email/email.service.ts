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