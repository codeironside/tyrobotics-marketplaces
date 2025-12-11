import { SocialAuthService } from "../../../CORE/service/sociel.service";
import { AppError } from "../../../CORE/utils/errorhandler";
import { SignupSession } from "./schema";
import { ISignUpSession } from "../interface";
import crypto from "crypto"
import mongoose from "mongoose";


export class SignupService {
  static async initiateSocialSignup(
    provider: string,
    code: string,
    req: any
  ): Promise<ISignUpSession> {
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
      firstName: socialProfile.firstName,
      lastName: socialProfile.lastName,
      avatar: socialProfile.photo,
    };
  }

  static async completeSocialSignupWithRoles(
    sessionToken: string,
    roleNames: string[],
    req: any
  ): Promise<{
    user: any;
    token: string;
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

      const selectedRoles = await Role.find({
        name: { $in: roleNames },
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
        token = jwt.sign(
          {
            userId: user._id,
            email: user.email,
            roles: user.roles,
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
      }

      await AuditLog.create(
        [
          {
            userId: user._id,
            action: "SOCIAL_SIGNUP_COMPLETED",
            resource: "USER",
            resourceId: user._id,
            metadata: {
              provider: signupSession.provider,
              roles: roleNames,
              ip: req.ip,
            },
          },
        ],
        { session }
      );

      await SignupAnalytics.create(
        [
          {
            userId: user._id,
            provider: signupSession.provider,
            roles: roleNames,
            source: "social",
            timestamp: new Date(),
          },
        ],
        { session }
      );

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
    token: string;
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
        token = jwt.sign(
          {
            userId: user._id,
            email: user.email,
            roles: user.roles,
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        await User.updateLastLogin(user._id);
      }

      await AuditLog.create(
        [
          {
            userId: user._id,
            action: "PROFILE_COMPLETED",
            resource: "USER",
            resourceId: user._id,
            metadata: {
              completedFields: Object.keys(profileData),
              ip: req.ip,
            },
          },
        ],
        { session }
      );

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
}