
import axios from "axios";
import { IWhatsAppContent, IChannelResult } from "../../interfaces";
import { config } from "../../../../utils/config";

export class WhatsAppService implements WhatsAppService {
  private apiKey: string;
  private senderId: string;
  private baseUrl: string = config.termii.base_url_whatsapp;

  constructor() {
    this.apiKey = config.termii.api_key;
    this.senderId = config.termii.senderId;
  }

  async send(to: string, content: IWhatsAppContent): Promise<IChannelResult> {
    try {
      const formattedTo = this.formatPhoneNumber(to);

      const payload = {
        api_key: this.apiKey,
        to: formattedTo,
        from: this.senderId,
        type: "text",
        channel: "whatsapp",
        text: content.text,
      };

      const response = await axios.post(`${this.baseUrl}/send`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return {
        success: true,
        channel: "whatsapp",
        message: "WhatsApp message sent successfully",
        data: response.data,
      };
    } catch (error: any) {
      console.error("WhatsApp sending failed:", error.message);

      return {
        success: false,
        channel: "whatsapp",
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
      const content = await templateManager.renderWhatsApp(templateName, data);
      return await this.send(to, content);
    } catch (error: any) {
      return {
        success: false,
        channel: "whatsapp",
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

  async sendTemplateMessage(
    to: string,
    templateName: string,
    templateData: Record<string, any>
  ): Promise<IChannelResult> {
    try {
      const formattedTo = this.formatPhoneNumber(to);

      const payload = {
        api_key: this.apiKey,
        to: formattedTo,
        from: this.senderId,
        type: "template",
        channel: "whatsapp",
        template_name: templateName,
        template_data: templateData,
      };

      const response = await axios.post(
        `${this.baseUrl}/send-template`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        channel: "whatsapp",
        message: "WhatsApp template sent successfully",
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        channel: "whatsapp",
        error: error.message,
      };
    }
  }
}
