import { Document, Types } from "mongoose";

export interface IVerificationToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  token: string;
  type:
    | "EMAIL_VERIFICATION"
    | "PASSWORD_RESET"
    | "PHONE_VERIFICATION"
    | "TWO_FACTOR"
    | "ACCOUNT_RECOVERY"
    | "EMAIL_CHANGE"
    | "PHONE_CHANGE";
  otpCode?: string;
  expiresAt: Date;
  usedAt?: Date;
  invalidatedAt?: Date;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    location?: string;
    attempts: number;
    lastAttemptAt?: Date;
  };
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
