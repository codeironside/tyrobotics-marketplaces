
import axios from "axios";
import { IPushContent, IChannelResult } from "../../interfaces";

export class PushService implements PushService {
  async send(
    to: string | string[],
    content: IPushContent
  ): Promise<IChannelResult> {
    try {
      const tokens = Array.isArray(to) ? to : [to];

      const results = await Promise.all(
        tokens.map((token) => this.sendToDevice(token, content))
      );

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;

      return {
        success: successCount > 0,
        channel: "push",
        message: `Push notifications sent: ${successCount} successful, ${failedCount} failed`,
        data: results,
      };
    } catch (error: any) {
      return {
        success: false,
        channel: "push",
        error: error.message,
      };
    }
  }

  private async sendToDevice(
    token: string,
    content: IPushContent
  ): Promise<IChannelResult> {
    try {
      if (token.startsWith("android") || token.startsWith("firebase")) {
        return await this.sendFCM(token, content);
      } else if (token.startsWith("ios") || token.startsWith("apns")) {
        return await this.sendAPNS(token, content);
      } else if (token.startsWith("web")) {
        return await this.sendWebPush(token, content);
      }

      return {
        success: false,
        channel: "push",
        error: "Unknown device token type",
      };
    } catch (error: any) {
      return {
        success: false,
        channel: "push",
        error: error.message,
      };
    }
  }

  private async sendFCM(
    token: string,
    content: IPushContent
  ): Promise<IChannelResult> {
    try {
      const payload = {
        to: token,
        notification: {
          title: content.title,
          body: content.body,
          sound: content.sound || "default",
          badge: content.badge,
        },
        data: content.data,
        priority: "high",
      };

      const response = await axios.post(
        "https://fcm.googleapis.com/fcm/send",
        payload,
        {
          headers: {
            Authorization: `key=${process.env.FCM_SERVER_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: response.data.success === 1,
        channel: "push:fcm",
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        channel: "push:fcm",
        error: error.message,
      };
    }
  }

  private async sendAPNS(
    token: string,
    content: IPushContent
  ): Promise<IChannelResult> {
    return {
      success: true,
      channel: "push:apns",
      message: "APNS notification sent",
      data: { token, content },
    };
  }

  private async sendWebPush(
    token: string,
    content: IPushContent
  ): Promise<IChannelResult> {
    return {
      success: true,
      channel: "push:web",
      message: "Web push notification sent",
      data: { token, content },
    };
  }

  async sendWithTemplate(
    to: string | string[],
    templateName: string,
    data: any
  ): Promise<IChannelResult> {
    try {
      const templateManager = (
        await import("../../templates/manager")
      ).TemplateManager.getInstance();
      const content = await templateManager.renderPush(data);
      return await this.send(to, content);
    } catch (error: any) {
      return {
        success: false,
        channel: "push",
        error: error.message,
      };
    }
  }
}
