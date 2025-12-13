
import axios from "axios";
import { ISMSContent, IChannelResult } from "../../interfaces";
import { config } from "../../../../utils/config";

export class SMSService implements SMSService {
  private apiKey: string;
  private senderId: string;
  private baseUrl: string = config.termii.base_url_sms;

  constructor() {
    this.apiKey = config.termii.api_key;
    this.senderId = config.termii.senderId || "Termii";
  }

  async send(to: string, content: ISMSContent): Promise<IChannelResult> {
    try {
      const formattedTo = this.formatPhoneNumber(to);

      const payload = {
        api_key: this.apiKey,
        to: formattedTo,
        from: this.senderId,
        sms: content.text.substring(0, 160), // Termii SMS limit
        type: "plain",
        channel: "generic",
      };

      const response = await axios.post(`${this.baseUrl}/send`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return {
        success: true,
        channel: "sms",
        message: "SMS sent successfully",
        data: response.data,
      };
    } catch (error: any) {
      console.error("SMS sending failed:", error.message);

      return {
        success: false,
        channel: "sms",
        error: error.response?.data?.message || error.message,
      };
    }
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
      const content = await templateManager.renderSMS(templateName, data);
      return await this.send(to, content);
    } catch (error: any) {
      return {
        success: false,
        channel: "sms",
        error: error.message,
      };
    }
  }

  private formatPhoneNumber(phone: string): string {
    let formatted = phone.replace(/\D/g, "");

    if (formatted.startsWith("0")) {
      formatted = "234" + formatted.substring(1);
    } else if (!formatted.startsWith("234")) {
      formatted = "234" + formatted;
    }

    return formatted;
  }

  async checkBalance(): Promise<{ balance: number; currency: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/balance`, {
        params: {
          api_key: this.apiKey,
        },
      });

      return {
        balance: response.data.balance,
        currency: response.data.currency,
      };
    } catch (error) {
      throw new Error("Failed to check SMS balance");
    }
  }

  async getDeliveryStatus(messageId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/status`, {
        params: {
          api_key: this.apiKey,
          message_id: messageId,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error("Failed to get SMS delivery status");
    }
  }
}
