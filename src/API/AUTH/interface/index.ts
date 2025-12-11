import { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  country?: string;
  timezone?: string;
  language?: string;
  canLogin: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  isProfileComplete: boolean;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  roles: Array<{
    roleId: Types.ObjectId;
    name: string;
    level: number;
    assignedAt: Date;
    assignedBy?: Types.ObjectId;
    isActive: boolean;
    canLogin: boolean;
  }>;
  authMethods: Array<{
    provider: string;
    providerId: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    createdAt: Date;
    lastUsedAt: Date;
    isPrimary: boolean;
  }>;
  security: {
    passwordHash?: string;
    passwordChangedAt?: Date;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    twoFactorRecoveryCodes?: string[];
    loginAttempts: number;
    lockUntil?: Date;
    lastPasswordChange?: Date;
  };
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    signupSource: "web" | "mobile" | "api";
    referralCode?: string;
    referredBy?: Types.ObjectId;
    campaign?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    newsletterSubscription: boolean;
    theme: "light" | "dark" | "auto";
  };
  profileCompletion: {
    personalInfo: boolean;
    contactInfo: boolean;
    preferences: boolean;
    requiredFields: string[];
    completedAt?: Date;
  };
  signupStatus: {
    step: "initial" | "profile" | "verification" | "completed";
    completedSteps: string[];
    currentStep: string;
    startedAt: Date;
    completedAt?: Date;
  };
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISocialProfile {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  provider: string;
  providerId: string;
  displayName: string;
  email: string;
  name?: string;
  firstName?: string;
  photo: string;
  emailVerified: boolean;
  accessToken: string;
  refreshToken: string;
  lastName?: string;
  picture?: string;
  locale?: string;
  verifiedEmail?: boolean;
  profileData: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
}
