
import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import { IEmailContent, ISMSContent, IWhatsAppContent, IInAppContent, IPushContent } from "../../interfaces";

export class TemplateManager {
  private static instance: TemplateManager;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();
  private basePath = path.join(__dirname, "templates");

  private constructor() {
    this.registerHelpers();
  }

  static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager();
    }
    return TemplateManager.instance;
  }

  private registerHelpers(): void {
    handlebars.registerHelper(
      "formatCurrency",
      (amount: number, currency: string) => {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency || "USD",
          minimumFractionDigits: 2,
        }).format(amount);
      }
    );

    handlebars.registerHelper("formatDate", (date: Date) => {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    });

    handlebars.registerHelper("truncate", (str: string, length: number) => {
      if (str.length <= length) return str;
      return str.substring(0, length) + "...";
    });

    handlebars.registerHelper("ifEquals", (a: any, b: any, options: any) => {
      return a === b ? options.fn(this) : options.inverse(this);
    });
  }

  async loadTemplate(
    type: string,
    templateName: string
  ): Promise<handlebars.TemplateDelegate> {
    const key = `${type}:${templateName}`;

    if (this.templates.has(key)) {
      return this.templates.get(key)!;
    }

    const templatePath = path.join(this.basePath, type, `${templateName}.html`);

    try {
      const templateSource = await fs.promises.readFile(templatePath, "utf-8");
      const template = handlebars.compile(templateSource);
      this.templates.set(key, template);
      return template;
    } catch (error) {
      throw new Error(`Template not found: ${templatePath}`);
    }
  }

  async loadSMSTemplate(templateName: string): Promise<string> {
    const smsPath = path.join(this.basePath, "sms", `${templateName}.txt`);

    try {
      return await fs.promises.readFile(smsPath, "utf-8");
    } catch (error) {
      throw new Error(`SMS template not found: ${smsPath}`);
    }
  }

  async loadWhatsAppTemplate(templateName: string): Promise<string> {
    const whatsappPath = path.join(
      this.basePath,
      "whatsapp",
      `${templateName}.txt`
    );

    try {
      return await fs.promises.readFile(whatsappPath, "utf-8");
    } catch (error) {
      throw new Error(`WhatsApp template not found: ${whatsappPath}`);
    }
  }

  async renderEmail(templateName: string, data: any): Promise<IEmailContent> {
    const template = await this.loadTemplate("email", templateName);

    const html = template(data);
    const text = this.htmlToPlainText(html);

    const subject = data.subject || this.getSubjectFromData(data);

    return {
      subject,
      html,
      text,
    };
  }

  async renderSMS(templateName: string, data: any): Promise<ISMSContent> {
    const templateSource = await this.loadSMSTemplate(templateName);
    const template = handlebars.compile(templateSource);

    return {
      text: template(data),
    };
  }

  async renderWhatsApp(
    templateName: string,
    data: any
  ): Promise<IWhatsAppContent> {
    const templateSource = await this.loadWhatsAppTemplate(templateName);
    const template = handlebars.compile(templateSource);

    return {
      text: template(data),
    };
  }

  private htmlToPlainText(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private getSubjectFromData(data: any): string {
    const emojis: Record<string, string> = {
      transaction: "💳",
      security: "🔒",
      account: "👤",
      payment: "💰",
      system: "⚙️",
      marketing: "📢",
      social: "👥",
      alert: "⚠️",
      reminder: "⏰",
      update: "🔄",
      verification: "✅",
      support: "🆘",
      announcement: "📢",
      welcome: "👋",
    };

    const emoji = emojis[data.type] || "📨";
    const priority = data.metadata?.priority || "medium";

    const priorityPrefix =
      priority === "urgent"
        ? "[URGENT] "
        : priority === "high"
        ? "[IMPORTANT] "
        : "";

    return `${priorityPrefix}${emoji} ${data.title}`;
  }

  async renderPush(data: any): Promise<IPushContent> {
    return {
      title: data.title,
      body: data.message,
      data: data.data,
      badge: 1,
      sound: "default",
    };
  }

  async renderInApp(data: any): Promise<any> {
    return {
      title: data.title,
      message: data.message,
      data: data.data,
    };
  }
}
