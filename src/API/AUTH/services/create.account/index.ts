import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { SignupService } from "../../../SIGNUPSERVICE/model";
import { SocialAuthService } from "../../../../CORE/service/sociel.service";
import { User } from "../../../AUTH/model";
import { Roles } from "../../../ROLES/model";
import { AppError } from "../../../../CORE/utils/errorhandler";
import { Logger } from "../../../../CORE/utils/logger";
import { ApiResponse } from "../../../../CORE/utils/apiresponse";
import { SIGN_UP_INITIATED } from "../../../../CORE/constants";

export class AuthController {
  static async getRequiredFields(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { roleNames } = req.params;
      const roleArray = roleNames.split(",");

      const roles = await Role.find({
        name: { $in: roleArray },
        canSignUp: true,
        isActive: true,
      }).select("name level");

      const requiredFields = roles.reduce((fields: string[], role) => {
        const roleFields = this.getRequiredFieldsForRole(role);
        return [...new Set([...fields, ...roleFields])];
      }, []);

      res.json({
        success: true,
        data: {
          requiredFields,
          roles: roles.map((r) => ({ name: r.name, level: r.level })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private static getRequiredFieldsForRole(role: any): string[] {
    const baseFields = ["firstName", "lastName", "country", "timezone"];

    if (role.level >= 5) {
      return [...baseFields, "phone", "dateOfBirth", "gender"];
    }

    if (["Developer", "Manager", "Admin"].includes(role.name)) {
      return [...baseFields, "phone", "language"];
    }

    return baseFields;
  }

  static async initiateSocialSignup(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { provider, code } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers["user-agent"];

      const result = await SignupService.initiateSocialSignup(
        provider,
        code,
        req
      );
      let data = {
        sessionToken: result.sessionToken,
        userInfo: {
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          avatar: result.avatar,
        },
      };
      await ApiResponse.success(res, data, SIGN_UP_INITIATED, 202);
      Logger.info(
        `Social signup initiated - Provider: ${provider}, IP: ${ipAddress}`
      );
      } catch (error as any) {
    
      Logger.error(
        `Social signup initiation failed - Provider: ${req.body.provider}, IP: ${req.ip}, Error: ${error.message}`
      );
      next(error);
    }
  }

  static async completeSocialSignup(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { sessionToken, roleNames } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers["user-agent"];

      console.log(
        `Social signup completion attempt - Session: ${sessionToken}, Roles: ${roleNames}, IP: ${ipAddress}`
      );

      const result = await SignupService.completeSocialSignupWithRoles(
        sessionToken,
        roleNames,
        req
      );

      const logData = {
        userId: result.user.id,
        email: result.user.email,
        roles: roleNames,
        ip: ipAddress,
        requiresProfileCompletion: result.requiresProfileCompletion,
        hasToken: !!result.token,
      };

      await AuditLogService.log({
        action: "SOCIAL_SIGNUP_COMPLETED",
        userId: result.user.id,
        resource: "USER",
        resourceId: result.user.id,
        metadata: logData,
      });

      console.log(
        `Social signup completed successfully - User: ${result.user.email}, Roles: ${roleNames}, IP: ${ipAddress}`
      );

      const responseData: any = {
        success: true,
        data: {
          user: result.user,
          requiresProfileCompletion: result.requiresProfileCompletion,
        },
      };

      if (result.token) {
        responseData.data.token = result.token;
      }

      res
        .status(result.requiresProfileCompletion ? 200 : 201)
        .json(responseData);
    } catch (error) {
      console.error(
        `Social signup completion failed - Session: ${req.body.sessionToken}, IP: ${req.ip}, Error: ${error.message}`
      );
      next(error);
    }
  }

  static async initiateEmailSignup(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, password, roleNames } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers["user-agent"];

      console.log(`Email signup initiated - Email: ${email}, IP: ${ipAddress}`);

      const result = await SignupService.initiateEmailSignup(
        email,
        password,
        roleNames,
        req
      );

      await AuditLogService.log({
        action: "EMAIL_SIGNUP_INITIATED",
        userId: null,
        resource: "USER",
        resourceId: null,
        metadata: {
          email,
          ip: ipAddress,
          hasVerificationSent: true,
        },
      });

      res.json({
        success: true,
        data: {
          sessionToken: result.sessionToken,
          message: "Verification email sent. Please check your inbox.",
        },
      });
    } catch (error) {
      console.error(
        `Email signup initiation failed - Email: ${req.body.email}, IP: ${req.ip}, Error: ${error.message}`
      );
      next(error);
    }
  }

  static async completeEmailSignup(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { sessionToken, verificationCode } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers["user-agent"];

      console.log(
        `Email signup completion attempt - Session: ${sessionToken}, IP: ${ipAddress}`
      );

      const result = await SignupService.completeEmailSignup(
        sessionToken,
        verificationCode,
        req
      );

      await AuditLogService.log({
        action: "EMAIL_SIGNUP_COMPLETED",
        userId: result.user.id,
        resource: "USER",
        resourceId: result.user.id,
        metadata: {
          email: result.user.email,
          ip: ipAddress,
          requiresProfileCompletion: result.requiresProfileCompletion,
        },
      });

      console.log(
        `Email signup completed successfully - User: ${result.user.email}, IP: ${ipAddress}`
      );

      const responseData: any = {
        success: true,
        data: {
          user: result.user,
          requiresProfileCompletion: result.requiresProfileCompletion,
        },
      };

      if (result.token) {
        responseData.data.token = result.token;
      }

      res
        .status(result.requiresProfileCompletion ? 200 : 201)
        .json(responseData);
    } catch (error) {
      console.error(
        `Email signup completion failed - Session: ${req.body.sessionToken}, IP: ${req.ip}, Error: ${error.message}`
      );
      next(error);
    }
  }

  static async completeProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = (req as any).user;
      const profileData = req.body;
      const ipAddress = req.ip;

      console.log(
        `Profile completion attempt - User: ${user.email}, IP: ${ipAddress}`
      );

      const result = await SignupService.completeProfile(
        user._id,
        profileData,
        req
      );

      await AuditLogService.log({
        action: "PROFILE_COMPLETED",
        userId: user._id,
        resource: "USER",
        resourceId: user._id,
        metadata: {
          completedFields: Object.keys(profileData),
          ip: ipAddress,
          signupCompleted: result.signupCompleted,
        },
      });

      console.log(
        `Profile completion successful - User: ${user.email}, Signup Completed: ${result.signupCompleted}, IP: ${ipAddress}`
      );

      const responseData: any = {
        success: true,
        data: {
          user: result.user,
          signupCompleted: result.signupCompleted,
        },
      };

      if (result.token) {
        responseData.data.token = result.token;
      }

      res.json(responseData);
    } catch (error) {
      console.error(
        `Profile completion failed - User: ${(req as any).user?.email}, IP: ${
          req.ip
        }, Error: ${error.message}`
      );
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      const ipAddress = req.ip;

      console.log(
        `Email verification attempt - Token: ${token}, IP: ${ipAddress}`
      );

      const result = await SignupService.verifyEmail(token, req);

      await AuditLogService.log({
        action: "EMAIL_VERIFIED",
        userId: result.user.id,
        resource: "USER",
        resourceId: result.user.id,
        metadata: {
          email: result.user.email,
          ip: ipAddress,
        },
      });

      console.log(
        `Email verification successful - User: ${result.user.email}, IP: ${ipAddress}`
      );

      res.json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error) {
      console.error(
        `Email verification failed - Token: ${req.body.token}, IP: ${req.ip}, Error: ${error.message}`
      );
      next(error);
    }
  }

  static async resendVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = req.body;
      const ipAddress = req.ip;

      console.log(
        `Resend verification request - Email: ${email}, IP: ${ipAddress}`
      );

      await SignupService.resendVerification(email, req);

      await AuditLogService.log({
        action: "VERIFICATION_RESENT",
        userId: null,
        resource: "USER",
        resourceId: null,
        metadata: {
          email,
          ip: ipAddress,
        },
      });

      console.log(
        `Verification email resent - Email: ${email}, IP: ${ipAddress}`
      );

      res.json({
        success: true,
        message: "Verification email resent successfully",
      });
    } catch (error) {
      console.error(
        `Resend verification failed - Email: ${req.body.email}, IP: ${req.ip}, Error: ${error.message}`
      );
      next(error);
    }
  }

  static async checkEmailAvailability(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = req.body;

      const existingUser = await User.findByEmail(email);

      res.json({
        success: true,
        data: {
          available: !existingUser,
          email,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async checkUsernameAvailability(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { username } = req.body;

      if (!username) {
        throw new AppError(400, "Username is required");
      }

      const existingUser = await User.findOne({ username });

      res.json({
        success: true,
        data: {
          available: !existingUser,
          username,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async socialLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider, code } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers["user-agent"];

      console.log(
        `Social login attempt - Provider: ${provider}, IP: ${ipAddress}`
      );

      const result = await SignupService.socialLogin(provider, code, req);

      await AuditLogService.log({
        action: "SOCIAL_LOGIN",
        userId: result.user.id,
        resource: "USER",
        resourceId: result.user.id,
        metadata: {
          provider,
          email: result.user.email,
          ip: ipAddress,
        },
      });

      console.log(
        `Social login successful - User: ${result.user.email}, Provider: ${provider}, IP: ${ipAddress}`
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(
        `Social login failed - Provider: ${req.body.provider}, IP: ${req.ip}, Error: ${error.message}`
      );
      next(error);
    }
  }

  static async emailLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers["user-agent"];

      console.log(`Email login attempt - Email: ${email}, IP: ${ipAddress}`);

      const result = await SignupService.emailLogin(email, password, req);

      await AuditLogService.log({
        action: "EMAIL_LOGIN",
        userId: result.user.id,
        resource: "USER",
        resourceId: result.user.id,
        metadata: {
          email: result.user.email,
          ip: ipAddress,
          successful: true,
        },
      });

      console.log(
        `Email login successful - User: ${result.user.email}, IP: ${ipAddress}`
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(
        `Email login failed - Email: ${req.body.email}, IP: ${req.ip}, Error: ${error.message}`
      );
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const ipAddress = req.ip;

      await AuditLogService.log({
        action: "LOGOUT",
        userId: user._id,
        resource: "USER",
        resourceId: user._id,
        metadata: {
          email: user.email,
          ip: ipAddress,
        },
      });

      console.log(`User logged out - User: ${user.email}, IP: ${ipAddress}`);

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const fullUser = await User.findById(user._id).select(
        "-security.passwordHash -security.twoFactorSecret -security.twoFactorRecoveryCodes"
      );

      res.json({
        success: true,
        data: fullUser,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const updateData = req.body;
      const ipAddress = req.ip;

      const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
        new: true,
      }).select(
        "-security.passwordHash -security.twoFactorSecret -security.twoFactorRecoveryCodes"
      );

      await AuditLogService.log({
        action: "PROFILE_UPDATED",
        userId: user._id,
        resource: "USER",
        resourceId: user._id,
        metadata: {
          email: user.email,
          ip: ipAddress,
          updatedFields: Object.keys(updateData),
        },
      });

      console.log(`Profile updated - User: ${user.email}, IP: ${ipAddress}`);

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { currentPassword, newPassword } = req.body;
      const ipAddress = req.ip;

      await SignupService.changePassword(
        user._id,
        currentPassword,
        newPassword,
        req
      );

      await AuditLogService.log({
        action: "PASSWORD_CHANGED",
        userId: user._id,
        resource: "USER",
        resourceId: user._id,
        metadata: {
          email: user.email,
          ip: ipAddress,
        },
      });

      console.log(`Password changed - User: ${user.email}, IP: ${ipAddress}`);

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error(
        `Password change failed - User: ${(req as any).user?.email}, IP: ${
          req.ip
        }, Error: ${error.message}`
      );
      next(error);
    }
  }

  static async getAuthMethods(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const fullUser = await User.findById(user._id);

      res.json({
        success: true,
        data: fullUser?.authMethods || [],
      });
    } catch (error) {
      next(error);
    }
  }

  static async linkAuthMethod(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { provider, code } = req.body;
      const ipAddress = req.ip;

      const result = await SignupService.linkAuthMethod(
        user._id,
        provider,
        code,
        req
      );

      await AuditLogService.log({
        action: "AUTH_METHOD_LINKED",
        userId: user._id,
        resource: "USER",
        resourceId: user._id,
        metadata: {
          email: user.email,
          provider,
          ip: ipAddress,
        },
      });

      console.log(
        `Auth method linked - User: ${user.email}, Provider: ${provider}, IP: ${ipAddress}`
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(
        `Auth method link failed - User: ${
          (req as any).user?.email
        }, Provider: ${req.body.provider}, IP: ${req.ip}, Error: ${
          error.message
        }`
      );
      next(error);
    }
  }

  static async unlinkAuthMethod(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = (req as any).user;
      const { methodId } = req.params;
      const ipAddress = req.ip;

      await SignupService.unlinkAuthMethod(user._id, methodId, req);

      await AuditLogService.log({
        action: "AUTH_METHOD_UNLINKED",
        userId: user._id,
        resource: "USER",
        resourceId: user._id,
        metadata: {
          email: user.email,
          methodId,
          ip: ipAddress,
        },
      });

      console.log(
        `Auth method unlinked - User: ${user.email}, Method ID: ${methodId}, IP: ${ipAddress}`
      );

      res.json({
        success: true,
        message: "Authentication method unlinked successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const ipAddress = req.ip;

      await SignupService.forgotPassword(email, req);

      await AuditLogService.log({
        action: "PASSWORD_RESET_REQUESTED",
        userId: null,
        resource: "USER",
        resourceId: null,
        metadata: {
          email,
          ip: ipAddress,
        },
      });

      console.log(
        `Password reset requested - Email: ${email}, IP: ${ipAddress}`
      );

      res.json({
        success: true,
        message: "Password reset instructions sent to your email",
      });
    } catch (error) {
      console.error(
        `Password reset request failed - Email: ${req.body.email}, IP: ${req.ip}, Error: ${error.message}`
      );
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      const ipAddress = req.ip;

      const result = await SignupService.resetPassword(token, newPassword, req);

      await AuditLogService.log({
        action: "PASSWORD_RESET_COMPLETED",
        userId: result.userId,
        resource: "USER",
        resourceId: result.userId,
        metadata: {
          ip: ipAddress,
        },
      });

      console.log(
        `Password reset completed - User ID: ${result.userId}, IP: ${ipAddress}`
      );

      res.json({
        success: true,
        message:
          "Password reset successfully. You can now login with your new password.",
      });
    } catch (error) {
      console.error(
        `Password reset failed - Token: ${req.body.token}, IP: ${req.ip}, Error: ${error.message}`
      );
      next(error);
    }
  }
}
