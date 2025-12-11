import { Types } from "mongoose";
export interface IUser {
  _id: Types.ObjectId;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastLoginAt: Date;
  userRoles: Array<{
    roleId: Types.ObjectId;
    roleName: string;
    assignedAt: Date;
    assignedBy?: Types.ObjectId;
    isActive: boolean;
  }>;
  authMethods: Array<{
    provider:
      | "email"
      | "google"
      | "facebook"
      | "github"
      | "linkedin"
      | "twitter";
    providerId: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    createdAt: Date;
    lastUsedAt: Date;
  }>;
  security: {
    passwordHash?: string;
    passwordChangedAt?: Date;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    loginAttempts: number;
    lockUntil?: Date;
  };
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    signupSource: "web" | "mobile" | "api";
    referralCode?: string;
    campaign?: string;
  };
  preferences: {
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}


export interface ISocialProfile {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  provider: string;
  providerId: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  locale?: string;
  verifiedEmail?: boolean;
  profileData: Record<string, any>;
  createdAt: Date;
}
