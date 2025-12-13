
import { Resend } from "resend";
import { IEmailContent, IChannelResult } from "../../interfaces";
import { AppError } from "../../../../utils/errorhandler";
import { config } from "../../../../utils/config";
export class EmailService implements EmailService {
  private resend: Resend;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.resend = new Resend(config.resend.api_key);
    this.fromEmail = config.resend.from;
    this.fromName = process.env.EMAIL_FROM_NAME || "Notification System";
  }

  async send(to: string, content: IEmailContent): Promise<IChannelResult> {
    try {
      const response = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to,
        subject: content.subject,
        html: content.html,
        text: content.text,
        tags: [
          { name: "channel", value: "email" },
          { name: "type", value: "notification" },
        ],
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return {
        success: true,
        channel: "email",
        message: "Email sent successfully",
        data: response.data,
      };
    } catch (error: any) {
      console.error("Email sending failed:", error.message);

      return {
        success: false,
        channel: "email",
        error: error.message,
      };
    }
  }

  async sendBatch(
    emails: Array<{ to: string; content: IEmailContent }>
  ): Promise<IChannelResult[]> {
    const results: IChannelResult[] = [];

    for (const email of emails) {
      try {
        const result = await this.send(email.to, email.content);
        results.push(result);
      } catch (error: any) {
        results.push({
          success: false,
          channel: "email",
          error: error.message,
        });
      }
    }

    return results;
  }

  async sendWithTemplate(
    to: string,
    templateName: string,
    data: any
  ): Promise<IChannelResult> {
    try {
      const templateManager = (
        await import("../../templates/manager")
      ).TemplateManager.getInstance();
      const content = await templateManager.renderEmail(templateName, data);
      return await this.send(to, content);
    } catch (error: any) {
      return {
        success: false,
        channel: "email",
        error: error.message,
      };
    }
  }
}
