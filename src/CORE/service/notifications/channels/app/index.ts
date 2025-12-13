
import { IInAppContent, IChannelResult } from "../../interfaces"
import { Types } from "mongoose";
import { NotificationModel } from "../../model";


export class InAppService implements InAppService {
  async send(userId: string, content: IInAppContent): Promise<IChannelResult> {
    try {
      const socketPayload = {
        userId,
        title: content.title,
        message: content.message,
        data: content.data,
        timestamp: new Date().toISOString(),
      };

      this.emitToUserSocket(userId, "notification:new", socketPayload);

      await this.saveNotification(userId, content);

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

  private emitToUserSocket(userId: string, event: string, data: any): void {
    const io = (global as any).io;
    if (io) {
      io.to(`user:${userId}`).emit(event, data);
    }
  }

  private async saveNotification(
    userId: string,
    content: IInAppContent & { type?: string; category?: string }
  ): Promise<void> {
    await NotificationModel.create({
      userId: new Types.ObjectId(userId),
      type: content.type || "system",
      category: content.category || "info",
      title: content.title,
      message: content.message,
      data: content.data,
      channels: {
        inApp: true,
        email: false,
        sms: false,
        whatsapp: false,
        push: false,
      },
      deliveryStatus: {
        inApp: {
          delivered: true,
          deliveredAt: new Date(),
          read: false,
        },
        email: {
          sent: false,
          delivered: false,
          opened: false,
          clicked: false,
        },
        sms: {
          sent: false,
          delivered: false,
        },
        whatsapp: {
          sent: false,
          delivered: false,
          read: false,
        },
        push: {
          sent: false,
          delivered: false,
          opened: false,
        },
      },
      metadata: {
        read: false,
        archived: false,
        priority: "medium",
        actionRequired: false,
        actionCompleted: false,
      },
    });
  }

  async sendWithTemplate(
    userId: string,
    templateName: string,
    data: any
  ): Promise<IChannelResult> {
    try {
      const templateManager = (
        await import("../../templates/manager")
      ).TemplateManager.getInstance();
      const content = await templateManager.renderInApp(data);
      return await this.send(userId, content);
    } catch (error: any) {
      return {
        success: false,
        channel: "inApp",
        error: error.message,
      };
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await NotificationModel.updateOne(
      {
        _id: notificationId,
        userId,
      },
      {
        "metadata.read": true,
        "metadata.readAt": new Date(),
      }
    );

    this.emitToUserSocket(userId, "notification:read", { notificationId });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await NotificationModel.countDocuments({
      userId,
      "metadata.read": false,
    });
  }
}
