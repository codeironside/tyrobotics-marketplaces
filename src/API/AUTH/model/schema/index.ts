import { Schema, model } from "mongoose";
import { IUser } from "../../interface";

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    phone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    country: {
      type: String,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    language: {
      type: String,
      default: "en",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    canLogin: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
    emailVerifiedAt: {
      type: Date,
    },
    phoneVerifiedAt: {
      type: Date,
    },
    roles: [
      {
        roleId: {
          type: Schema.Types.ObjectId,
          ref: "Role",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        level: {
          type: Number,
          required: true,
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        assignedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        canLogin: {
          type: Boolean,
          default: true,
        },
      },
    ],
    authMethods: [
      {
        provider: {
          type: String,
          required: true,
          enum: [
            "email",
            "google",
            "facebook",
            "github",
            "linkedin",
            "twitter",
          ],
        },
        providerId: {
          type: String,
          required: true,
        },
        accessToken: String,
        refreshToken: String,
        expiresAt: Date,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        lastUsedAt: {
          type: Date,
          default: Date.now,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    security: {
      passwordHash: String,
      passwordChangedAt: Date,
      twoFactorEnabled: {
        type: Boolean,
        default: false,
      },
      twoFactorSecret: String,
      twoFactorRecoveryCodes: [String],
      loginAttempts: {
        type: Number,
        default: 0,
      },
      lockUntil: Date,
      lastPasswordChange: Date,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      signupSource: {
        type: String,
        enum: ["web", "mobile", "api"],
        default: "web",
      },
      referralCode: String,
      referredBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      campaign: String,
      utmSource: String,
      utmMedium: String,
      utmCampaign: String,
    },
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      pushNotifications: {
        type: Boolean,
        default: false,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
      newsletterSubscription: {
        type: Boolean,
        default: false,
      },
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "auto",
      },
    },
    profileCompletion: {
      personalInfo: {
        type: Boolean,
        default: false,
      },
      contactInfo: {
        type: Boolean,
        default: false,
      },
      preferences: {
        type: Boolean,
        default: false,
      },
      requiredFields: [String],
      completedAt: Date,
    },
    signupStatus: {
      step: {
        type: String,
        enum: ["initial", "profile", "verification", "completed"],
        default: "initial",
      },
      completedSteps: [String],
      currentStep: {
        type: String,
        default: "select_roles",
      },
      startedAt: {
        type: Date,
        default: Date.now,
      },
      completedAt: Date,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ "roles.name": 1 });
userSchema.index({ "authMethods.provider": 1, "authMethods.providerId": 1 });
userSchema.index({ "metadata.referralCode": 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ "signupStatus.completedAt": 1 });

export const UserModel = model<IUser>("User", userSchema);
