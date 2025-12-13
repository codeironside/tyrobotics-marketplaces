import { Types } from "mongoose";
import crypto from "crypto";
import { VerificationTokenModel } from "./schema";
import { IVerificationToken } from "../interface";
import { AppError } from "../../../CORE/utils/errorhandler";

export class VerificationToken {
  static async createEmailVerification(
    userId: Types.ObjectId,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
      location?: string;
    }
  ): Promise<IVerificationToken> {
    const token = crypto.randomBytes(32).toString("hex");
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.invalidateUserTokens(userId, "EMAIL_VERIFICATION");

    return await VerificationTokenModel.create({
      userId,
      token,
      type: "EMAIL_VERIFICATION",
      otpCode,
      expiresAt,
      metadata: {
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        deviceId: metadata?.deviceId,
        location: metadata?.location,
        attempts: 0,
      },
    });
  }

  static async createPasswordReset(
    userId: Types.ObjectId,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
      location?: string;
    }
  ): Promise<IVerificationToken> {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await this.invalidateUserTokens(userId, "PASSWORD_RESET");

    return await VerificationTokenModel.create({
      userId,
      token,
      type: "PASSWORD_RESET",
      expiresAt,
      metadata: {
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        deviceId: metadata?.deviceId,
        location: metadata?.location,
        attempts: 0,
      },
    });
  }

  static async createPhoneVerification(
    userId: Types.ObjectId,
    phone: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
      location?: string;
    }
  ): Promise<IVerificationToken> {
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.invalidateUserTokens(userId, "PHONE_VERIFICATION");

    return await VerificationTokenModel.create({
      userId,
      token: crypto.randomBytes(32).toString("hex"),
      type: "PHONE_VERIFICATION",
      otpCode,
      expiresAt,
      data: { phone },
      metadata: {
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        deviceId: metadata?.deviceId,
        location: metadata?.location,
        attempts: 0,
      },
    });
  }

  static async createTwoFactorToken(
    userId: Types.ObjectId,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
      location?: string;
    }
  ): Promise<IVerificationToken> {
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.invalidateUserTokens(userId, "TWO_FACTOR");

    return await VerificationTokenModel.create({
      userId,
      token: crypto.randomBytes(32).toString("hex"),
      type: "TWO_FACTOR",
      otpCode,
      expiresAt,
      metadata: {
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        deviceId: metadata?.deviceId,
        location: metadata?.location,
        attempts: 0,
      },
    });
  }

  static async createAccountRecovery(
    userId: Types.ObjectId,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
      location?: string;
    }
  ): Promise<IVerificationToken> {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await this.invalidateUserTokens(userId, "ACCOUNT_RECOVERY");

    return await VerificationTokenModel.create({
      userId,
      token,
      type: "ACCOUNT_RECOVERY",
      expiresAt,
      metadata: {
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        deviceId: metadata?.deviceId,
        location: metadata?.location,
        attempts: 0,
      },
    });
  }

  static async verifyEmailToken(
    token: string,
    otpCode?: string
  ): Promise<IVerificationToken> {
    const verificationToken = await VerificationTokenModel.findOne({
      token,
      type: "EMAIL_VERIFICATION",
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
      invalidatedAt: { $exists: false },
    });

    if (!verificationToken) {
      throw new AppError(400, "Invalid or expired verification token");
    }

    if (otpCode && verificationToken.otpCode !== otpCode) {
      await this.incrementAttempt(verificationToken._id);
      throw new AppError(400, "Invalid OTP code");
    }

    verificationToken.usedAt = new Date();
    await verificationToken.save();

    return verificationToken;
  }

  static async verifyPasswordResetToken(
    token: string
  ): Promise<IVerificationToken> {
    const verificationToken = await VerificationTokenModel.findOne({
      token,
      type: "PASSWORD_RESET",
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
      invalidatedAt: { $exists: false },
    });

    if (!verificationToken) {
      throw new AppError(400, "Invalid or expired reset token");
    }

    return verificationToken;
  }

  static async verifyPhoneToken(
    userId: Types.ObjectId,
    otpCode: string
  ): Promise<IVerificationToken> {
    const verificationToken = await VerificationTokenModel.findOne({
      userId,
      type: "PHONE_VERIFICATION",
      otpCode,
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
      invalidatedAt: { $exists: false },
    });

    if (!verificationToken) {
      throw new AppError(400, "Invalid or expired OTP code");
    }

    verificationToken.usedAt = new Date();
    await verificationToken.save();

    return verificationToken;
  }

  static async verifyTwoFactorToken(
    userId: Types.ObjectId,
    otpCode: string
  ): Promise<IVerificationToken> {
    const verificationToken = await VerificationTokenModel.findOne({
      userId,
      type: "TWO_FACTOR",
      otpCode,
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
      invalidatedAt: { $exists: false },
    });

    if (!verificationToken) {
      throw new AppError(400, "Invalid or expired two-factor code");
    }

    verificationToken.usedAt = new Date();
    await verificationToken.save();

    return verificationToken;
  }

  static async markTokenUsed(tokenId: Types.ObjectId): Promise<void> {
    await VerificationTokenModel.findByIdAndUpdate(tokenId, {
      usedAt: new Date(),
    });
  }

  static async invalidateUserTokens(
    userId: Types.ObjectId,
    type?: string
  ): Promise<void> {
    const filter: any = {
      userId,
      usedAt: { $exists: false },
      invalidatedAt: { $exists: false },
    };

    if (type) {
      filter.type = type;
    }

    await VerificationTokenModel.updateMany(filter, {
      invalidatedAt: new Date(),
    });
  }

  static async incrementAttempt(tokenId: Types.ObjectId): Promise<void> {
    const token = await VerificationTokenModel.findById(tokenId);

    if (token) {
      token.metadata.attempts += 1;
      token.metadata.lastAttemptAt = new Date();

      if (token.metadata.attempts >= 5) {
        token.invalidatedAt = new Date();
      }

      await token.save();
    }
  }

  static async getActiveToken(
    userId: Types.ObjectId,
    type: string
  ): Promise<IVerificationToken | null> {
    return await VerificationTokenModel.findOne({
      userId,
      type,
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
      invalidatedAt: { $exists: false },
    });
  }

  static async resendOtp(
    userId: Types.ObjectId,
    type: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
      location?: string;
    }
  ): Promise<IVerificationToken> {
    await this.invalidateUserTokens(userId, type);

    switch (type) {
      case "EMAIL_VERIFICATION":
        return await this.createEmailVerification(userId, metadata);
      case "PHONE_VERIFICATION":
        return await this.createPhoneVerification(userId, "", metadata);
      case "TWO_FACTOR":
        return await this.createTwoFactorToken(userId, metadata);
      default:
        throw new AppError(400, `Cannot resend OTP for type: ${type}`);
    }
  }

  static async validateOtpRateLimit(
    userId: Types.ObjectId,
    type: string
  ): Promise<void> {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const recentAttempts = await VerificationTokenModel.countDocuments({
      userId,
      type,
      "metadata.lastAttemptAt": { $gte: oneMinuteAgo },
    });

    if (recentAttempts >= 3) {
      throw new AppError(
        429,
        "Too many OTP attempts. Please wait before trying again."
      );
    }
  }

  static async cleanupExpiredTokens(): Promise<number> {
    const result = await VerificationTokenModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    return result.deletedCount;
  }

  static async getTokenByOtpCode(
    otpCode: string,
    type: string
  ): Promise<IVerificationToken | null> {
    return await VerificationTokenModel.findOne({
      otpCode,
      type,
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
      invalidatedAt: { $exists: false },
    });
  }

  static async getTokensByUser(
    userId: Types.ObjectId,
    type?: string
  ): Promise<IVerificationToken[]> {
    const filter: any = { userId };

    if (type) {
      filter.type = type;
    }

    return await VerificationTokenModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(10);
  }

  static async isTokenValid(token: string, type: string): Promise<boolean> {
    const verificationToken = await VerificationTokenModel.findOne({
      token,
      type,
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
      invalidatedAt: { $exists: false },
    });

    return !!verificationToken;
  }

  static async deleteToken(tokenId: Types.ObjectId): Promise<void> {
    await VerificationTokenModel.findByIdAndDelete(tokenId);
  }

  static async deleteAllUserTokens(userId: Types.ObjectId): Promise<void> {
    await VerificationTokenModel.deleteMany({ userId });
  }
}
