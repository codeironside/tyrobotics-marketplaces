export const API_VERSION: string = "/api/v1";

export enum Role {
  SUPER_ADMIN = "SuperAdmin",
  ADMIN = "Admin",
  FRONTEND = "Frontend",
  BACKEND = "Backend",
  PRODUCT_MANAGER = "ProductManagers",
  PRODUCT_DESIGNER = "ProductDesigners",
  SELLER = "Seller",
  BUYER = "Buyer",
}

export const ROLES_FETCHED_SUCCESSFUL = "ALL ROlES GOTTEN SUCCESSFUL";
export const ROLE_CREATED = "ROLE CREATED";
export const SOCIALS_CREATED = "SOCIALS CREATED";
export const SOCIALS_FETCHED_SUCCESSFUL = "ALL SOCIALS GOTTEN SUCCESSFUL";
export const SIGN_UP_INITIATED = "SIGN UP INITIATED";
export const SOCIAL_SIGN_UP_COMPLETED = " SOCIAL SIGN UP COMPLETED";
export const EMAIL_SIGN_UP_COMPLETED = " EMAIL SIGN UP COMPLETED";
export const EMAIL_SIGN_UP_INITIATED = " EMAIL SIGN UP INITIATED";
export const RESEND_VERIFICATION = "VERIFICATION RESENT ";
export const SEND_VERIFICATION = "VERIFICATION SENT ";
export const PROFILE_COMPLETED = "PROFILE COMPLETED";
export const EMAIL_AVAILAIBLE="EMAIL AVAILABLE"
export const User_NAME_AVAILAIBLE="USER NAME AVAILABLE"
export const LOGIN_SUCCESSFUL ="LOGIN SUCCESSFUL"
export const LOGOUT_SUCCESSFUL ="LOGOUT SUCCESSFUL"
export const PROFILE_FETCHED_SUCCESSFUL ="PROFILE FETCHED SUCCESSFUL"
export const PROFILE_UPDATED_SUCCESSFUL ="PROFILE UPDATED SUCCESSFUL"
export const CHANGE_PASSWORD = "PASSWORD CHANGED SUCCESSFUL"
export const GET_AUTH = "AUTH METHODS FETCHED"
export const LINK_AUTH = "AUTH METHODS LINKED"
export const UN_LINK_AUTH = "AUTH METHODS UNLINKED"
export const FORGOT_PASSWORD = "PASSWORD RESET INSTRUCTIONS SENT"
export const RESET_PASSWORD = "PASSWORD RESET SUCCESSFUL, YOU CAN NOW LOGIN WITH YOUR NEW PASSWORD"



export enum SocialSignIns {
  EMAIL = "email",
  GOOGLE = "google",
  FACEBOOK = "facebook",
  GITHUB = "github",
  LINKEDIN = "linkedin",
  TWITTER = "twitter",
}

import { Types } from "mongoose";

export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, any>;
  metadata: {
    read: boolean;
    readAt?: Date;
    archived: boolean;
    archivedAt?: Date;
    priority: "low" | "medium" | "high" | "urgent";
    expiresAt?: Date;
    actionRequired: boolean;
    actionUrl?: string;
    actionLabel?: string;
    actionCompleted: boolean;
    actionCompletedAt?: Date;
  };
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    push: boolean;
  };
  deliveryStatus: {
    inApp: {
      delivered: boolean;
      deliveredAt?: Date;
      read: boolean;
      readAt?: Date;
    };
    email: {
      sent: boolean;
      sentAt?: Date;
      delivered: boolean;
      deliveredAt?: Date;
      opened: boolean;
      openedAt?: Date;
      clicked: boolean;
      clickedAt?: Date;
      providerResponse?: any;
      error?: string;
    };
    sms: {
      sent: boolean;
      sentAt?: Date;
      delivered: boolean;
      deliveredAt?: Date;
      providerResponse?: any;
      error?: string;
    };
    whatsapp: {
      sent: boolean;
      sentAt?: Date;
      delivered: boolean;
      deliveredAt?: Date;
      read: boolean;
      readAt?: Date;
      providerResponse?: any;
      error?: string;
    };
    push: {
      sent: boolean;
      sentAt?: Date;
      delivered: boolean;
      deliveredAt?: Date;
      opened: boolean;
      openedAt?: Date;
      providerResponse?: any;
      error?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
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
  | "announcement";

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

export interface NotificationOptions {
  userId: Types.ObjectId;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: {
    inApp?: boolean;
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
    push?: boolean;
  };
  priority?: "low" | "medium" | "high" | "urgent";
  expiresInHours?: number;
  actionRequired?: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  tags?: Array<{ name: string; value: string }>;
}

export interface SMSOptions {
  to: string;
  text: string;
  from?: string;
  type?: "plain" | "unicode";
  channel?: "generic" | "dnd" | "whatsapp";
}

export interface WhatsAppOptions {
  to: string;
  text: string;
  from?: string;
  type?: "text" | "media" | "template";
  mediaUrl?: string;
  templateName?: string;
  templateData?: Record<string, any>;
}

export interface PushOptions {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  image?: string;
  badge?: number;
  sound?: string;
  priority?: "normal" | "high";
  ttl?: number;
  channelId?: string;
}
