import { Types } from "mongoose";
import axios from "axios";
import { Resend } from "resend";
import { NotificationModel } from "../../../CORE/NOTIFICATIONS/models";
import { User } from "src/API/AUTH/model";
import { AppError } from "../../../CORE/utils/errorhandler";
import {
  NotificationOptions,
  EmailOptions,
  SMSOptions,
  WhatsAppOptions,
  PushOptions,
} from "../../constants";

export class NotificationService {
  private resend: Resend;
  private termiiApiKey: string;
  private termiiSenderId: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.termiiApiKey = process.env.TERMII_API_KEY;
    this.termiiSenderId = process.env.TERMII_SENDER_ID;
  }

  async send(options: NotificationOptions): Promise<any> {
    const session = await NotificationModel.startSession();

    try {
      session.startTransaction();

      const user = await User.findById(options.userId).session(session);

      if (!user) {
        throw new AppError(404, "User not found");
      }

      const notificationData = {
        userId: options.userId,
        type: options.type,
        category: options.category,
        title: options.title,
        message: options.message,
        data: options.data,
        metadata: {
          read: false,
          archived: false,
          priority: options.priority || "medium",
          expiresAt: options.expiresInHours
            ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000)
            : undefined,
          actionRequired: options.actionRequired || false,
          actionUrl: options.actionUrl,
          actionLabel: options.actionLabel,
          actionCompleted: false,
        },
        channels: {
          inApp: options.channels.inApp || false,
          email: options.channels.email || false,
          sms: options.channels.sms || false,
          whatsapp: options.channels.whatsapp || false,
          push: options.channels.push || false,
        },
        deliveryStatus: {
          inApp: { delivered: false, read: false },
          email: {
            sent: false,
            delivered: false,
            opened: false,
            clicked: false,
          },
          sms: { sent: false, delivered: false },
          whatsapp: { sent: false, delivered: false, read: false },
          push: { sent: false, delivered: false, opened: false },
        },
      };

      const notification = await NotificationModel.create([notificationData], {
        session,
      });

      const deliveryResults = await this.deliverToChannels(
        notification[0],
        user,
        options,
        session
      );

      await session.commitTransaction();

      await this.updateNotificationDeliveryStatus(
        notification[0]._id,
        deliveryResults
      );

      return {
        notificationId: notification[0]._id,
        deliveryResults,
        notification: notification[0],
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async deliverToChannels(
    notification: any,
    user: any,
    options: NotificationOptions,
    session: any
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    if (options.channels.inApp) {
      results.inApp = await this.sendInAppNotification(
        notification,
        user,
        options
      );
    }

    if (options.channels.email && user.email) {
      results.email = await this.sendEmailNotification(
        notification,
        user,
        options
      );
    }

    if (options.channels.sms && user.phone) {
      results.sms = await this.sendSMSNotification(notification, user, options);
    }

    if (options.channels.whatsapp && user.phone) {
      results.whatsapp = await this.sendWhatsAppNotification(
        notification,
        user,
        options
      );
    }

    if (options.channels.push) {
      results.push = await this.sendPushNotification(
        notification,
        user,
        options
      );
    }

    return results;
  }

  private async sendInAppNotification(
    notification: any,
    user: any,
    options: NotificationOptions
  ): Promise<any> {
    try {
      const socketPayload = {
        notificationId: notification._id,
        userId: user._id,
        type: notification.type,
        category: notification.category,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        metadata: notification.metadata,
        createdAt: new Date(),
      };

      this.emitToUserSocket(
        user._id.toString(),
        "notification:new",
        socketPayload
      );

      await this.updateInAppDeliveryStatus(notification._id, {
        delivered: true,
        deliveredAt: new Date(),
      });

      return {
        success: true,
        channel: "inApp",
        message: "In-app notification delivered",
      };
    } catch (error: any) {
      return {
        success: false,
        channel: "inApp",
        error: error.message,
      };
    }
  }

  private async sendEmailNotification(
    notification: any,
    user: any,
    options: NotificationOptions
  ): Promise<any> {
    try {
      if (!user.email) {
        return {
          success: false,
          channel: "email",
          error: "User email not available",
        };
      }

      const emailHtml = this.generateEmailTemplate(notification, user);
      const emailText = this.generatePlainText(notification.message);

      const emailOptions: EmailOptions = {
        to: user.email,
        subject: `${this.getEmojiForType(notification.type)} ${
          notification.title
        }`,
        html: emailHtml,
        text: emailText,
        from: process.env.EMAIL_FROM || "notifications@yourdomain.com",
        tags: [
          { name: "notification_type", value: notification.type },
          { name: "category", value: notification.category },
          { name: "user_id", value: user._id.toString() },
        ],
      };

      const emailResult = await this.resend.emails.send(emailOptions);

      await this.updateEmailDeliveryStatus(notification._id, {
        sent: true,
        sentAt: new Date(),
        delivered: true,
        deliveredAt: new Date(),
        providerResponse: emailResult,
      });

      return {
        success: true,
        channel: "email",
        message: "Email sent successfully",
        data: emailResult,
      };
    } catch (error: any) {
      await this.updateEmailDeliveryStatus(notification._id, {
        sent: false,
        error: error.message,
      });

      return {
        success: false,
        channel: "email",
        error: error.message,
      };
    }
  }

  private async sendSMSNotification(
    notification: any,
    user: any,
    options: NotificationOptions
  ): Promise<any> {
    try {
      if (!user.phone) {
        return {
          success: false,
          channel: "sms",
          error: "User phone number not available",
        };
      }

      const smsOptions: SMSOptions = {
        to: user.phone.replace("+", ""),
        text: `${notification.title}: ${notification.message}`.substring(
          0,
          160
        ),
        from: this.termiiSenderId,
        type: "plain",
        channel: "generic",
      };

      const termiiResponse = await axios.post(
        "https://api.ng.termii.com/api/sms/send",
        {
          api_key: this.termiiApiKey,
          to: smsOptions.to,
          from: smsOptions.from,
          sms: smsOptions.text,
          type: smsOptions.type,
          channel: smsOptions.channel,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      await this.updateSMSDeliveryStatus(notification._id, {
        sent: true,
        sentAt: new Date(),
        delivered: termiiResponse.data?.status === "sent",
        deliveredAt:
          termiiResponse.data?.status === "sent" ? new Date() : undefined,
        providerResponse: termiiResponse.data,
      });

      return {
        success: true,
        channel: "sms",
        message: "SMS sent successfully",
        data: termiiResponse.data,
      };
    } catch (error: any) {
      await this.updateSMSDeliveryStatus(notification._id, {
        sent: false,
        error: error.message,
      });

      return {
        success: false,
        channel: "sms",
        error: error.message,
      };
    }
  }

  private async sendWhatsAppNotification(
    notification: any,
    user: any,
    options: NotificationOptions
  ): Promise<any> {
    try {
      if (!user.phone) {
        return {
          success: false,
          channel: "whatsapp",
          error: "User phone number not available",
        };
      }

      const whatsappOptions: WhatsAppOptions = {
        to: user.phone.replace("+", ""),
        text: `${notification.title}\n\n${notification.message}`,
        from: this.termiiSenderId,
        type: "text",
      };

      const termiiResponse = await axios.post(
        "https://api.ng.termii.com/api/whatsapp/send",
        {
          api_key: this.termiiApiKey,
          to: `234${whatsappOptions.to.slice(-10)}`,
          from: whatsappOptions.from,
          type: "text",
          channel: "whatsapp",
          text: whatsappOptions.text,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      await this.updateWhatsAppDeliveryStatus(notification._id, {
        sent: true,
        sentAt: new Date(),
        delivered: termiiResponse.data?.status === "sent",
        deliveredAt:
          termiiResponse.data?.status === "sent" ? new Date() : undefined,
        providerResponse: termiiResponse.data,
      });

      return {
        success: true,
        channel: "whatsapp",
        message: "WhatsApp message sent successfully",
        data: termiiResponse.data,
      };
    } catch (error: any) {
      await this.updateWhatsAppDeliveryStatus(notification._id, {
        sent: false,
        error: error.message,
      });

      return {
        success: false,
        channel: "whatsapp",
        error: error.message,
      };
    }
  }

  private async sendPushNotification(
    notification: any,
    user: any,
    options: NotificationOptions
  ): Promise<any> {
    try {
      const pushTokens = await this.getUserPushTokens(user._id);

      if (pushTokens.length === 0) {
        return {
          success: false,
          channel: "push",
          error: "No push tokens found for user",
        };
      }

      const pushOptions: PushOptions = {
        to: pushTokens,
        title: notification.title,
        body: notification.message,
        data: {
          notificationId: notification._id.toString(),
          type: notification.type,
          category: notification.category,
          ...notification.data,
        },
        priority:
          notification.metadata.priority === "urgent" ? "high" : "normal",
        ttl: 3600,
      };

      const pushResults = await this.sendToPushProviders(pushOptions);

      await this.updatePushDeliveryStatus(notification._id, {
        sent: true,
        sentAt: new Date(),
        delivered: pushResults.success,
        deliveredAt: pushResults.success ? new Date() : undefined,
        providerResponse: pushResults,
      });

      return {
        success: pushResults.success,
        channel: "push",
        message: "Push notifications sent",
        data: pushResults,
      };
    } catch (error: any) {
      await this.updatePushDeliveryStatus(notification._id, {
        sent: false,
        error: error.message,
      });

      return {
        success: false,
        channel: "push",
        error: error.message,
      };
    }
  }

  private async sendToPushProviders(options: PushOptions): Promise<any> {
    const results = {
      success: false,
      fcm: null,
      apns: null,
      webpush: null,
    };

    try {
      if (process.env.FCM_SERVER_KEY) {
        const fcmResult = await this.sendFCMNotification(options);
        results.fcm = fcmResult;
        results.success = results.success || fcmResult.success;
      }

      if (process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID) {
        const apnsResult = await this.sendAPNSNotification(options);
        results.apns = apnsResult;
        results.success = results.success || apnsResult.success;
      }

      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        const webpushResult = await this.sendWebPushNotification(options);
        results.webpush = webpushResult;
        results.success = results.success || webpushResult.success;
      }

      return results;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendFCMNotification(options: PushOptions): Promise<any> {
    try {
      const response = await axios.post(
        "https://fcm.googleapis.com/fcm/send",
        {
          registration_ids: Array.isArray(options.to)
            ? options.to
            : [options.to],
          notification: {
            title: options.title,
            body: options.body,
            image: options.image,
          },
          data: options.data,
          android: {
            priority: options.priority === "high" ? "high" : "normal",
            ttl: `${options.ttl || 3600}s`,
            notification: {
              channel_id: options.channelId || "default",
            },
          },
          apns: {
            headers: {
              "apns-priority": options.priority === "high" ? "10" : "5",
            },
            payload: {
              aps: {
                alert: {
                  title: options.title,
                  body: options.body,
                },
                badge: options.badge,
                sound: options.sound || "default",
                "content-available": 1,
              },
            },
          },
        },
        {
          headers: {
            Authorization: `key=${process.env.FCM_SERVER_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendAPNSNotification(options: PushOptions): Promise<any> {
    return { success: true, message: "APNS not implemented" };
  }

  private async sendWebPushNotification(options: PushOptions): Promise<any> {
    return { success: true, message: "WebPush not implemented" };
  }

  private async getUserPushTokens(userId: Types.ObjectId): Promise<string[]> {
    const user = await User.findById(userId);
    return user?.pushTokens || [];
  }

  private async updateNotificationDeliveryStatus(
    notificationId: Types.ObjectId,
    results: Record<string, any>
  ): Promise<void> {
    const updates: any = {};

    if (results.inApp) {
      updates["deliveryStatus.inApp"] = {
        delivered: results.inApp.success,
        deliveredAt: results.inApp.success ? new Date() : undefined,
      };
    }

    if (results.email) {
      updates["deliveryStatus.email"] = {
        sent: results.email.success,
        sentAt: results.email.success ? new Date() : undefined,
        delivered: results.email.success,
        deliveredAt: results.email.success ? new Date() : undefined,
        error: results.email.error || undefined,
      };
    }

    if (results.sms) {
      updates["deliveryStatus.sms"] = {
        sent: results.sms.success,
        sentAt: results.sms.success ? new Date() : undefined,
        delivered: results.sms.success,
        deliveredAt: results.sms.success ? new Date() : undefined,
        error: results.sms.error || undefined,
      };
    }

    if (results.whatsapp) {
      updates["deliveryStatus.whatsapp"] = {
        sent: results.whatsapp.success,
        sentAt: results.whatsapp.success ? new Date() : undefined,
        delivered: results.whatsapp.success,
        deliveredAt: results.whatsapp.success ? new Date() : undefined,
        error: results.whatsapp.error || undefined,
      };
    }

    if (results.push) {
      updates["deliveryStatus.push"] = {
        sent: results.push.success,
        sentAt: results.push.success ? new Date() : undefined,
        delivered: results.push.success,
        deliveredAt: results.push.success ? new Date() : undefined,
        error: results.push.error || undefined,
      };
    }

    await NotificationModel.findByIdAndUpdate(notificationId, updates);
  }

  private async updateInAppDeliveryStatus(
    notificationId: Types.ObjectId,
    status: any
  ): Promise<void> {
    await NotificationModel.findByIdAndUpdate(notificationId, {
      "deliveryStatus.inApp": status,
    });
  }

  private async updateEmailDeliveryStatus(
    notificationId: Types.ObjectId,
    status: any
  ): Promise<void> {
    await NotificationModel.findByIdAndUpdate(notificationId, {
      "deliveryStatus.email": status,
    });
  }

  private async updateSMSDeliveryStatus(
    notificationId: Types.ObjectId,
    status: any
  ): Promise<void> {
    await NotificationModel.findByIdAndUpdate(notificationId, {
      "deliveryStatus.sms": status,
    });
  }

  private async updateWhatsAppDeliveryStatus(
    notificationId: Types.ObjectId,
    status: any
  ): Promise<void> {
    await NotificationModel.findByIdAndUpdate(notificationId, {
      "deliveryStatus.whatsapp": status,
    });
  }

  private async updatePushDeliveryStatus(
    notificationId: Types.ObjectId,
    status: any
  ): Promise<void> {
    await NotificationModel.findByIdAndUpdate(notificationId, {
      "deliveryStatus.push": status,
    });
  }

  private emitToUserSocket(userId: string, event: string, data: any): void {
    const io = (global as any).io;
    if (io) {
      io.to(`user:${userId}`).emit(event, data);
    }
  }

  private generateEmailTemplate(notification: any, user: any): string {
    const priorityColors = {
      low: "#3498db",
      medium: "#f39c12",
      high: "#e74c3c",
      urgent: "#c0392b",
    };

    const categoryIcons = {
      financial: "💰",
      security: "🔒",
      account: "👤",
      system: "⚙️",
      marketing: "📢",
      social: "👥",
      transaction: "💳",
      alert: "⚠️",
      info: "ℹ️",
    };

    const emoji = this.getEmojiForType(notification.type);
    const priorityColor =
      priorityColors[notification.metadata.priority] || "#f39c12";
    const categoryIcon = categoryIcons[notification.category] || "📨";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${priorityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .priority { display: inline-block; padding: 4px 12px; background-color: ${priorityColor}; color: white; border-radius: 20px; font-size: 12px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; }
          .action-button { display: inline-block; padding: 12px 24px; background-color: ${priorityColor}; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          .category { margin-bottom: 10px; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">${emoji} ${notification.title}</h1>
          <div class="category">
            ${categoryIcon} ${notification.category} • ${notification.type}
          </div>
          <span class="priority">${
            notification.metadata.priority
          } priority</span>
        </div>
        <div class="content">
          <p>${notification.message}</p>
          
          ${
            notification.data
              ? `
            <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-left: 4px solid ${priorityColor};">
              ${Object.entries(notification.data)
                .map(
                  ([key, value]) => `
                <p><strong>${key}:</strong> ${value}</p>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }
          
          ${
            notification.metadata.actionRequired &&
            notification.metadata.actionUrl
              ? `
            <a href="${notification.metadata.actionUrl}" class="action-button">
              ${notification.metadata.actionLabel || "Take Action"}
            </a>
          `
              : ""
          }
        </div>
        <div class="footer">
          <p>This notification was sent to ${
            user.email
          } on ${new Date().toLocaleDateString()}.</p>
          <p>If you didn't expect this notification, please contact support.</p>
          <p>&copy; ${new Date().getFullYear()} ${
      process.env.APP_NAME || "Your App"
    }. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  private generatePlainText(text: string): string {
    return text.replace(/<[^>]*>/g, "");
  }

  private getEmojiForType(type: NotificationType): string {
    const emojis = {
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
    };
    return emojis[type] || "📨";
  }

  async markAsRead(
    notificationId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<void> {
    await NotificationModel.findOneAndUpdate(
      {
        _id: notificationId,
        userId,
      },
      {
        "metadata.read": true,
        "metadata.readAt": new Date(),
        "deliveryStatus.inApp.read": true,
        "deliveryStatus.inApp.readAt": new Date(),
      }
    );
  }

  async markAllAsRead(userId: Types.ObjectId): Promise<number> {
    const result = await NotificationModel.updateMany(
      {
        userId,
        "metadata.read": false,
      },
      {
        "metadata.read": true,
        "metadata.readAt": new Date(),
        "deliveryStatus.inApp.read": true,
        "deliveryStatus.inApp.readAt": new Date(),
      }
    );

    return result.modifiedCount;
  }

  async archive(
    notificationId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<void> {
    await NotificationModel.findOneAndUpdate(
      {
        _id: notificationId,
        userId,
      },
      {
        "metadata.archived": true,
        "metadata.archivedAt": new Date(),
      }
    );
  }

  async completeAction(
    notificationId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<void> {
    await NotificationModel.findOneAndUpdate(
      {
        _id: notificationId,
        userId,
      },
      {
        "metadata.actionCompleted": true,
        "metadata.actionCompletedAt": new Date(),
      }
    );
  }

  async getUserNotifications(
    userId: Types.ObjectId,
    filters: {
      read?: boolean;
      archived?: boolean;
      type?: string;
      category?: string;
      priority?: string;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ notifications: any[]; total: number }> {
    const query: any = { userId };

    if (filters.read !== undefined) {
      query["metadata.read"] = filters.read;
    }

    if (filters.archived !== undefined) {
      query["metadata.archived"] = filters.archived;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.priority) {
      query["metadata.priority"] = filters.priority;
    }

    const total = await NotificationModel.countDocuments(query);

    const notifications = await NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .skip(filters.skip || 0)
      .limit(filters.limit || 20)
      .lean();

    return { notifications, total };
  }

  async getUnreadCount(userId: Types.ObjectId): Promise<number> {
    return await NotificationModel.countDocuments({
      userId,
      "metadata.read": false,
      "metadata.archived": false,
    });
  }

  async sendBatch(
    users: Types.ObjectId[],
    options: Omit<NotificationOptions, "userId"> & {
      userIds?: Types.ObjectId[];
    }
  ): Promise<any> {
    const results = [];

    for (const userId of users) {
      try {
        const result = await this.send({
          ...options,
          userId,
        } as NotificationOptions);
        results.push({
          userId,
          success: true,
          notificationId: result.notificationId,
        });
      } catch (error: any) {
        results.push({
          userId,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  async deleteExpiredNotifications(): Promise<number> {
    const result = await NotificationModel.deleteMany({
      "metadata.expiresAt": { $lt: new Date() },
    });

    return result.deletedCount;
  }
}
