import { Schema, model } from "mongoose";
import { IVerificationToken } from "../../interface";

const verificationTokenSchema = new Schema<IVerificationToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "EMAIL_VERIFICATION",
        "PASSWORD_RESET",
        "PHONE_VERIFICATION",
        "TWO_FACTOR",
        "ACCOUNT_RECOVERY",
        "EMAIL_CHANGE",
        "PHONE_CHANGE",
      ],
      index: true,
    },
    otpCode: {
      type: String,
      length: 6,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      expires: 0,
    },
    usedAt: {
      type: Date,
    },
    invalidatedAt: {
      type: Date,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      deviceId: String,
      location: String,
      attempts: {
        type: Number,
        default: 0,
      },
      lastAttemptAt: Date,
    },
    data: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

verificationTokenSchema.index({ userId: 1, type: 1, usedAt: 1 });
verificationTokenSchema.index({ token: 1, type: 1 });
verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
verificationTokenSchema.index({ createdAt: 1 });
verificationTokenSchema.index({ "metadata.attempts": 1 });

export const VerificationTokenModel = model<IVerificationToken>(
  "VerificationToken",
  verificationTokenSchema
);
