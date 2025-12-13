// notifications/interfaces.ts
import { Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    whatsappNotifications: boolean;
  };
  pushTokens?: string[];
}

export interface INotificationData {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, any>;
  metadata?: {
    priority?: "low" | "medium" | "high" | "urgent";
    expiresInHours?: number;
    actionRequired?: boolean;
    actionUrl?: string;
    actionLabel?: string;
  };
}

export interface INotificationRequest {
  user: IUser;
  notification: INotificationData;
  channels: {
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
  templateData?: Record<string, any>;
}

export interface IChannelResult {
  success: boolean;
  channel: string;
  message?: string;
  error?: string;
  data?: any;
}

export interface IEmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface ISMSContent {
  text: string;
}

export interface IWhatsAppContent {
  text: string;
}

export interface IPushContent {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

export interface IInAppContent {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, any>;
  metadata?: {
    priority?: "low" | "medium" | "high" | "urgent";
    expiresInHours?: number;
    actionRequired?: boolean;
    actionUrl?: string;
    actionLabel?: string;
  };
}

export type NotificationType =
  | "transaction"
  | "security"
  | "account"
  | "payment"
  | "system"
  | "marketing"
  | "social"
  | "alert"
  | "reminder"
  | "update"
  | "verification"
  | "support"
  | "announcement"
  | "welcome";

export type NotificationCategory =
  | "financial"
  | "security"
  | "account"
  | "system"
  | "marketing"
  | "social"
  | "transaction"
  | "alert"
  | "info";

export interface IEmailService {
  send(to: string, content: IEmailContent): Promise<IChannelResult>;
}

export interface ISMSService {
  send(to: string, content: ISMSContent): Promise<IChannelResult>;
}

export interface IWhatsAppService {
  send(to: string, content: IWhatsAppContent): Promise<IChannelResult>;
}

export interface IPushService {
  send(to: string | string[], content: IPushContent): Promise<IChannelResult>;
}

export interface IInAppService {
  send(userId: string, content: IInAppContent): Promise<IChannelResult>;
}
