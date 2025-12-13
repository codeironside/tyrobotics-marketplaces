// notifications/dispatcher.ts
import {
  INotificationRequest,
  IChannelResult,
  IUser,
  INotificationData,
} from "../interfaces";
import { EmailService } from "../channels/emails";
import { SMSService } from "../channels/sms";
import { WhatsAppService } from "../channels/whatsapp";
import { PushService } from "../channels/push.notifications";
import { InAppService } from "../channels/app";
import { TemplateManager } from "../templates/manager";

export class NotificationDispatcher {
  private emailService: EmailService;
  private smsService: SMSService;
  private whatsAppService: WhatsAppService;
  private pushService: PushService;
  private inAppService: InAppService;
  private templateManager: TemplateManager;

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.whatsAppService = new WhatsAppService();
    this.pushService = new PushService();
    this.inAppService = new InAppService();
    this.templateManager = TemplateManager.getInstance();
  }

  async send(request: INotificationRequest): Promise<{
    notificationId?: string;
    results: Record<string, IChannelResult>;
    success: boolean;
  }> {
    const results: Record<string, IChannelResult> = {};
    const templateData = this.prepareTemplateData(request);

    if (
      request.channels.email &&
      request.user.email &&
      request.user.preferences.emailNotifications
    ) {
      results.email = await this.sendEmail(
        request.user.email,
        request.notification,
        templateData
      );
    }

    if (
      request.channels.sms &&
      request.user.phone &&
      request.user.preferences.smsNotifications
    ) {
      results.sms = await this.sendSMS(
        request.user.phone,
        request.notification,
        templateData
      );
    }

    if (
      request.channels.whatsapp &&
      request.user.phone &&
      request.user.preferences.whatsappNotifications
    ) {
      results.whatsapp = await this.sendWhatsApp(
        request.user.phone,
        request.notification,
        templateData
      );
    }

    if (
      request.channels.push &&
      request.user.pushTokens &&
      request.user.preferences.pushNotifications
    ) {
      results.push = await this.sendPush(
        request.user.pushTokens,
        request.notification,
        templateData
      );
    }

    if (request.channels.inApp) {
      results.inApp = await this.sendInApp(
        request.user._id.toString(),
        request.notification,
        templateData
      );
    }

    const success = Object.values(results).some((result) => result.success);

    return {
      results,
      success,
    };
  }

  async sendEmail(
    to: string,
    notification: INotificationData,
    templateData: any
  ): Promise<IChannelResult> {
    const templateName = this.getTemplateName(notification.type, "email");
    return await this.emailService.sendWithTemplate(
      to,
      templateName,
      templateData
    );
  }

  async sendSMS(
    to: string,
    notification: INotificationData,
    templateData: any
  ): Promise<IChannelResult> {
    const templateName = this.getTemplateName(notification.type, "sms");
    return await this.smsService.sendWithTemplate(
      to,
      templateName,
      templateData
    );
  }

  async sendWhatsApp(
    to: string,
    notification: INotificationData,
    templateData: any
  ): Promise<IChannelResult> {
    const templateName = this.getTemplateName(notification.type, "whatsapp");
    return await this.whatsAppService.sendWithTemplate(
      to,
      templateName,
      templateData
    );
  }

  async sendPush(
    to: string[],
    notification: INotificationData,
    templateData: any
  ): Promise<IChannelResult> {
    return await this.pushService.sendWithTemplate(
      to,
      notification.type,
      templateData
    );
  }

  async sendInApp(
    userId: string,
    notification: INotificationData,
    templateData: any
  ): Promise<IChannelResult> {
    return await this.inAppService.sendWithTemplate(
      userId,
      notification.type,
      templateData
    );
  }

  private prepareTemplateData(request: INotificationRequest): any {
    const now = new Date();

    return {
      ...request.notification,
      ...request.templateData,
      user: request.user,
      metadata: {
        ...request.notification.metadata,
        timestamp: now,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
      },
      app: {
        name: process.env.APP_NAME || "Our Platform",
        url: process.env.APP_URL,
        supportEmail: process.env.SUPPORT_EMAIL,
        supportPhone: process.env.SUPPORT_PHONE,
      },
    };
  }

  private getTemplateName(type: string, channel: string): string {
    const templateMap: Record<string, Record<string, string>> = {
      transaction: {
        email: "transaction",
        sms: "transaction",
        whatsapp: "transaction",
      },
      security: {
        email: "security",
        sms: "security",
        whatsapp: "security",
      },
      welcome: {
        email: "welcome",
        sms: "welcome",
        whatsapp: "welcome",
      },
      account: {
        email: "account",
        sms: "account",
        whatsapp: "account",
      },
      payment: {
        email: "payment",
        sms: "payment",
        whatsapp: "payment",
      },
      system: {
        email: "system",
        sms: "system",
        whatsapp: "system",
      },
    };

    return templateMap[type]?.[channel] || type;
  }

  async sendBatch(
    users: IUser[],
    notification: INotificationData,
    channels: { [key: string]: boolean },
    templateData?: Record<string, any>
  ): Promise<
    Array<{ userId: string; results: Record<string, IChannelResult> }>
  > {
    const results = [];

    for (const user of users) {
      try {
        const result = await this.send({
          user,
          notification,
          channels,
          templateData,
        });

        results.push({
          userId: user._id.toString(),
          results: result.results,
        });
      } catch (error: any) {
        results.push({
          userId: user._id.toString(),
          results: {
            error: {
              success: false,
              channel: "system",
              error: error.message,
            },
          },
        });
      }
    }

    return results;
  }
}
