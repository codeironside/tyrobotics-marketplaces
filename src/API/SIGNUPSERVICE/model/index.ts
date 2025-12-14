import { SocialAuthService } from "../../../CORE/service/social.service";
import { AppError } from "../../../CORE/utils/errorhandler";
import { SignupSession } from "./schema";
import { ISignUpSessionResponse } from "../interface";
import crypto from "crypto";
import mongoose from "mongoose";
import { User } from "../../../API/AUTH/model";
import bcrypt from "bcryptjs";
import { Roles, RoleModel } from "../../../API/ROLES/model";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { VerificationToken } from "../../../API/OTP/model";
import { generateJwtToken } from "../../../CORE/utils/jwttokengenerator/indet";
import { VerificationTokenModel } from "../../../API/OTP/model/schema";
import { UserModel } from "../../../API/AUTH/model/schema";
import notificationDispatcher from "../../../CORE/service/notifications";
import { WELCOME_MESSAGE } from "../../../CORE/constants";
import { Role } from "../../../CORE/constants";

export class SignupService {
  static async initiateSocialSignup(
    provider: string,
    code: string,
    req: any
  ): Promise<ISignUpSessionResponse> {
    const socialProfile = await SocialAuthService.verifySocialToken(
      provider,
      code
    );

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await SignupSession.create({
      sessionToken,
      provider,
      email: socialProfile.email,
      profileData: socialProfile,
      expiresAt,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    return {
      sessionToken,
      email: socialProfile.email,
      firstName: socialProfile.firstName!,
      lastName: socialProfile.lastName!,
      avatar: socialProfile.photo,
    };
  }

  static async completeSocialSignupWithRoles(
    sessionToken: string,
    roleNames: Role[],
    req: any
  ): Promise<{
    user: any;
    token: any;
    requiresProfileCompletion: boolean;
  }> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const signupSession = await SignupSession.findOne({
        sessionToken,
        expiresAt: { $gt: new Date() },
      }).session(session);

      if (!signupSession) {
        throw new AppError(400, "Invalid or expired session");
      }

      const selectedRoles = await RoleModel.find({
        name: { $in: roleNames }, // roleNames now correctly contains 'Role' enum values
        canSignUp: true,
        isActive: true,
      }).session(session);

      if (selectedRoles.length !== roleNames.length) {
        const validRoleNames = selectedRoles.map((role) => role.name);
        const invalidRoles = roleNames.filter(
          (name) => !validRoleNames.includes(name)
        );
        throw new AppError(
          400,
          `Invalid roles for signup: ${invalidRoles.join(", ")}`
        );
      }

      const user = await User.createUserWithSocial(
        {
          provider: signupSession.provider,
          providerId: signupSession.profileData.providerId,
          email: signupSession.profileData.email,
          firstName: signupSession.profileData.firstName,
          lastName: signupSession.profileData.lastName,
          avatar: signupSession.profileData.photo,
          emailVerified: signupSession.profileData.emailVerified,
          accessToken: signupSession.profileData.accessToken,
          refreshToken: signupSession.profileData.refreshToken,
          expiresAt: signupSession.profileData.expiresAt,
        },
        selectedRoles.map((role) => ({
          _id: role._id,
          name: role.name,
          level: role.level,
          canLogin: role.canLogin,
        })),
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          signupSource: "web",
          referralCode: req.body.referralCode,
          campaign: req.body.campaign,
        }
      );

      await SignupSession.deleteOne({ _id: signupSession._id }).session(
        session
      );

      const requiresProfileCompletion = !user.isProfileComplete;
      const canLogin =
        selectedRoles.every((role) => role.canLogin) && user.isEmailVerified;

      let token = null;
      if (canLogin && !requiresProfileCompletion) {
        token = await generateJwtToken({
          userId: user._id.toString(),
          email: user.email,
          roles: user.roles,
        });
      }

      await session.commitTransaction();

      // Assuming this notification dispatch works as intended
      const result = await notificationDispatcher.send({
        user: {
          _id: user._id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          preferences: {
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: true,
            whatsappNotifications: true,
          },
          pushTokens: ["firebase-token-123", "apns-token-456"],
        },
        notification: {
          type: "welcome",
          category: "account",
          title: WELCOME_MESSAGE,
          message: "Your payment of $100 was processed successfully",
          data: {
            amount: 100,
            currency: "USD",
            transactionId: "TX123456",
            recipient: "Vendor Name",
            date: new Date(),
          },
          metadata: {
            priority: "high",
            actionRequired: false,
          },
        },
        channels: {
          email: true,
          sms: true,
          whatsapp: true,
          push: true,
          inApp: true,
        },
        templateData: {
          merchant: "Vendor Name",
          reference: "REF123456",
        },
      });

      return {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          roles: user.roles,
          isEmailVerified: user.isEmailVerified,
          isProfileComplete: user.isProfileComplete,
          signupStatus: user.signupStatus,
        },
        token,
        requiresProfileCompletion,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  static async initiateEmailSignup(
    email: string,
    password: string,
    roleNames: Role[],
    req: any
  ): Promise<{ sessionToken: string }> {
    const session = await mongoose.startSession();

    try {
      const existingUser = await User.findByEmail(email);

      if (existingUser) {
        throw new AppError(409, "Email already registered");
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      const verificationCode = crypto.randomInt(100000, 999999).toString();

      const selectedRoles = await RoleModel.find({
        name: { $in: roleNames },
        canSignUp: true,
        isActive: true,
      }).session(session); // Pass session to the query

      if (selectedRoles.length !== roleNames.length) {
        const validRoleNames = selectedRoles.map((role) => role.name);
        const invalidRoles = roleNames.filter(
          (name) => !validRoleNames.includes(name)
        );
        throw new AppError(
          400,
          `Invalid roles for signup: ${invalidRoles.join(", ")}`
        );
      }

      await SignupSession.create({
        sessionToken,
        provider: "email",
        email: email.toLowerCase(),
        profileData: {
          email: email.toLowerCase(),
          passwordHash,
          roleNames,
          selectedRoles: selectedRoles.map((role) => ({
            _id: role._id,
            name: role.name,
            level: role.level,
            canLogin: role.canLogin,
          })),
        },
        verificationCode,
        expiresAt,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        },
      });

      return { sessionToken };
    } catch (error) {
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async completeEmailSignup(
    sessionToken: string,
    verificationCode: string,
    roleNames: string,
    req: any
  ): Promise<{
    user: any;
    token: string | null;
    requiresProfileCompletion: boolean;
  }> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const signupSession = await SignupSession.findOne({
        sessionToken,
        expiresAt: { $gt: new Date() },
      }).session(session);

      if (!signupSession) {
        throw new AppError(400, "Invalid or expired session");
      }

      if (signupSession.verificationCode !== verificationCode) {
        throw new AppError(400, "Invalid verification code");
      }

      const existingUser = await User.findByEmail(signupSession.email, session);

      if (existingUser) {
        throw new AppError(409, "Email already registered");
      }

      const user = await User.createUserWithEmail(
        signupSession.email,
        signupSession.profileData.passwordHash,
        signupSession.profileData.selectedRoles,
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          signupSource: "web",
          referralCode: req.body.referralCode,
          campaign: req.body.campaign,
        }
      );

      await SignupSession.deleteOne({ _id: signupSession._id }).session(
        session
      );

      const requiresProfileCompletion = !user.isProfileComplete;
      const canLogin =
        signupSession.profileData.selectedRoles.every(
          (role: any) => role.canLogin
        ) && user.isEmailVerified;

      let token = null;
      if (canLogin && !requiresProfileCompletion) {
        token = generateJwtToken({
          userId: user._id.toString(),
          email: user.email,
          roles: user.roles,
        });
      }

      await session.commitTransaction();

      return {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          roles: user.roles,
          isEmailVerified: user.isEmailVerified,
          isProfileComplete: user.isProfileComplete,
          signupStatus: user.signupStatus,
        },
        token,
        requiresProfileCompletion,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async completeProfile(
    userId: Types.ObjectId,
    profileData: any,
    req: any
  ): Promise<{
    user: any;
    token: string | null;
    signupCompleted: boolean;
  }> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const user = await User.completeSignup(userId, profileData);

      const canLogin =
        user.roles.every((role) => role.canLogin) && user.isEmailVerified;
      const signupCompleted = user.signupStatus.step === "completed";

      let token = null;
      if (canLogin && signupCompleted) {
        token = generateJwtToken({
          userId: user._id.toString(),
          email: user.email,
          roles: user.roles,
        });

        await User.updateLastLogin(user._id);
      }

      

      await session.commitTransaction();

      return {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          roles: user.roles,
          isEmailVerified: user.isEmailVerified,
          isProfileComplete: user.isProfileComplete,
          signupStatus: user.signupStatus,
        },
        token,
        signupCompleted,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async resendVerification(email: string, req: any): Promise<void> {
    const user = await User.findByEmail(email);

    if (!user) {
      throw new AppError(404, "User not found");
    }

    if (user.isEmailVerified) {
      throw new AppError(400, "Email already verified");
    }

    const verificationCode = crypto.randomInt(100000, 999999).toString();

    const existingSession = await SignupSession.findOne({
      email: email.toLowerCase(),
      provider: "email",
    });

    if (existingSession) {
      existingSession.verificationCode = verificationCode;
      existingSession.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await existingSession.save();
    } else {
      await SignupSession.create({
        sessionToken: crypto.randomBytes(32).toString("hex"),
        provider: "email",
        email: email.toLowerCase(),
        verificationCode,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        metadata: {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        },
      });
    }

    await this.sendVerificationEmail(email, verificationCode);
  }

  static async verifyEmail(
    token: string,
    req: any,
    otpCode: string
  ): Promise<{
    user: any;
    token: string;
  }> {
    const verificationToken = await VerificationToken.verifyEmailToken(
      token,
      otpCode
    );

    if (!verificationToken) {
      throw new AppError(400, "Invalid or expired verification token");
    }

    const user = await User.verifyEmail(verificationToken.userId);

    verificationToken.usedAt = new Date();
    await verificationToken.save();

    const jwtToken = await generateJwtToken({
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });
    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        roles: user.roles,
        isEmailVerified: user.isEmailVerified,
        isProfileComplete: user.isProfileComplete,
      },
      token: jwtToken,
    };
  }

  private static async sendVerificationEmail(
    email: string,
    code: string
  ): Promise<void> {
    const emailService = {
      send: async (data: any) => {
        console.log(`Verification email sent to ${email}: ${code}`);
      },
    };

    await emailService.send({
      to: email,
      subject: "Verify Your Email",
      html: `
        <h2>Email Verification</h2>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>This code will expire in 30 minutes.</p>
      `,
    });
  }

  static async socialLogin(
    provider: string,
    code: string,
    req: any
  ): Promise<{
    user: any;
    token: string;
  }> {
    const socialProfile = await SocialAuthService.verifySocialToken(
      provider,
      code
    );

    const user = await User.findBySocialProvider(
      provider,
      socialProfile.providerId
    );

    if (!user) {
      throw new AppError(404, "No account found with this social profile");
    }

    if (!user.isActive) {
      throw new AppError(403, "Account is deactivated");
    }

    const loginableRoles = user.roles.filter((role: any) => role.canLogin);

    if (loginableRoles.length === 0) {
      throw new AppError(403, "No loginable roles assigned");
    }

    await User.updateLastLogin(user._id);
    const token = await generateJwtToken({
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });

    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        roles: user.roles,
        isEmailVerified: user.isEmailVerified,
        isProfileComplete: user.isProfileComplete,
      },
      token,
    };
  }

  static async emailLogin(
    email: string,
    password: string,
    req: any
  ): Promise<{
    user: any;
    token: string;
  }> {
    const user = await User.findByEmail(email);

    if (!user) {
      throw new AppError(404, "User not found");
    }

    if (!user.isActive) {
      throw new AppError(403, "Account is deactivated");
    }

    if (!user.security.passwordHash) {
      throw new AppError(400, "Password login not available for this account");
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.security.passwordHash
    );

    if (!passwordValid) {
      await User.incrementLoginAttempts(user._id);
      throw new AppError(401, "Invalid credentials");
    }

    if (user.security.lockUntil && user.security.lockUntil > new Date()) {
      throw new AppError(403, "Account is locked. Please try again later.");
    }

    const loginableRoles = user.roles.filter((role: any) => role.canLogin);

    if (loginableRoles.length === 0) {
      throw new AppError(403, "No loginable roles assigned");
    }

    if (!user.isEmailVerified) {
      throw new AppError(403, "Email verification required");
    }

    await User.updateLastLogin(user._id);
    const token = generateJwtToken({
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });

    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        roles: user.roles,
        isEmailVerified: user.isEmailVerified,
        isProfileComplete: user.isProfileComplete,
      },
      token,
    };
  }

  static async changePassword(
    userId: Types.ObjectId,
    currentPassword: string,
    newPassword: string,
    req: any
  ): Promise<void> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, "User not found");
    }

    if (!user.security.passwordHash) {
      throw new AppError(400, "Password login not available for this account");
    }

    const passwordValid = await bcrypt.compare(
      currentPassword,
      user.security.passwordHash
    );

    if (!passwordValid) {
      throw new AppError(401, "Current password is incorrect");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await User.resetPassword(userId, newPasswordHash);
  }

  static async forgotPassword(email: string, req: any): Promise<void> {
    const user = await User.findByEmail(email);

    if (!user) {
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

    await VerificationTokenModel.create({
      userId: user._id,
      token: resetToken,
      type: "PASSWORD_RESET",
      expiresAt,
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const emailService = {
      send: async (data: any) => {
        console.log(`Password reset email sent to ${email}: ${resetLink}`);
      },
    };

    await emailService.send({
      to: email,
      subject: "Password Reset",
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });
  }

  static async resetPassword(
    token: string,
    newPassword: string,
    req: any
  ): Promise<{
    userId: Types.ObjectId;
  }> {
    const verificationToken = await VerificationTokenModel.findOne({
      token,
      type: "PASSWORD_RESET",
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
    });

    if (!verificationToken) {
      throw new AppError(400, "Invalid or expired reset token");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await User.resetPassword(verificationToken.userId, newPasswordHash);

    verificationToken.usedAt = new Date();
    await verificationToken.save();

    return {
      userId: verificationToken.userId,
    };
  }

  static async linkAuthMethod(
    userId: Types.ObjectId,
    provider: string,
    code: string,
    req: any
  ): Promise<any> {
    const socialProfile = await SocialAuthService.verifySocialToken(
      provider,
      code
    );

    const existingAuth = await User.findBySocialProvider(
      provider,
      socialProfile.providerId
    );

    if (existingAuth) {
      throw new AppError(
        409,
        "This social account is already linked to another user"
      );
    }

    await User.addAuthMethod(userId, {
      provider,
      providerId: socialProfile.providerId,
      accessToken: socialProfile.accessToken,
      refreshToken: socialProfile.refreshToken,
      expiresAt: socialProfile.expiresAt,
    });

    return {
      provider,
      linkedAt: new Date(),
    };
  }

  static async unlinkAuthMethod(
    userId: Types.ObjectId,
    methodId: string,
    req: any
  ): Promise<void> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, "User not found");
    }

    const authMethod = user.authMethods.find(
      (method: any) => method._id.toString() === methodId
    );

    if (!authMethod) {
      throw new AppError(404, "Auth method not found");
    }

    if (authMethod.isPrimary && user.authMethods.length > 1) {
      throw new AppError(400, "Cannot unlink primary auth method");
    }

    await UserModel.findByIdAndUpdate(userId, {
      $pull: { authMethods: { _id: methodId } },
    });
  }
}
