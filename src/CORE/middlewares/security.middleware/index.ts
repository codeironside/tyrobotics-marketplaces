import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { SignupSession } from "../../../API/SIGNUPSERVICE/model/schema";
import { Socials } from "../../../API/SIGN.UP.METHODS/model";
import { Logger } from "../../utils/logger";
import { ErrorHandler } from "../../utils/errorhandler";
import { ApiResponse } from "../../utils/apiresponse";
import { AppError } from "../../utils/errorhandler";
import jwt from "jsonwebtoken";
import { User } from "../../../API/AUTH/model";
import { config } from "../../../CORE/utils/config";
import { UserModel } from "../../../API/AUTH/model/schema";
const signupRateLimit = rateLimit({
  
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many signup attempts. Please try again later.",
  },
});

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

const verificationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many verification attempts. Please try again later.",
  },
});

export class SecurityMiddleware {
  static async validateProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider } = req.body;
      const validProvider = await Socials.findByName(provider);
      const validProviders = [
        "google",
        "facebook",
        "github",
        "linkedin",
        "twitter",
      ];
      if (!validProvider) {
        return ApiResponse.error(
          res,
          `Invalid provider. Must be one of: ${validProviders.join(", ")}`,
          400
        );
      }
      next();
    } catch (error) {
        Logger.warn(`provider is not valid`);
throw new AppError(400, "provider is not valid")
    }
  }

    static validateEmail(req: Request, res: Response, next: NextFunction) {
      try{
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
throw new AppError(400, "email is not valid")
      }

      next();
      } catch (error) {
          throw new AppError(400, "email is not valid");
    };
  }

  static validatePassword() {
    return (req: Request, res: Response, next: NextFunction) => {
      const { password, newPassword } = req.body;
      const passwordToValidate = password || newPassword;

      if (!passwordToValidate) {
        return res.status(400).json({
          success: false,
          message: "Password is required",
        });
      }

      if (passwordToValidate.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters long",
        });
      }

      if (!/[A-Z]/.test(passwordToValidate)) {
        return res.status(400).json({
          success: false,
          message: "Password must contain at least one uppercase letter",
        });
      }

      if (!/[a-z]/.test(passwordToValidate)) {
        return res.status(400).json({
          success: false,
          message: "Password must contain at least one lowercase letter",
        });
      }

      if (!/[0-9]/.test(passwordToValidate)) {
        return res.status(400).json({
          success: false,
          message: "Password must contain at least one number",
        });
      }

      next();
    };
  }

  static validateRoleSelection() {
    return (req: Request, res: Response, next: NextFunction) => {
      const { roleNames } = req.body;

      if (!roleNames || !Array.isArray(roleNames)) {
        return res.status(400).json({
          success: false,
          message: "roleNames must be an array",
        });
      }

      if (roleNames.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one role must be selected",
        });
      }

      if (roleNames.length > 3) {
        return res.status(400).json({
          success: false,
          message: "Maximum 3 roles allowed per signup",
        });
      }

      const uniqueRoles = [...new Set(roleNames)];
      if (uniqueRoles.length !== roleNames.length) {
        return res.status(400).json({
          success: false,
          message: "Duplicate roles are not allowed",
        });
      }

      next();
    };
  }

  static validateSessionToken() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const { sessionToken } = req.body;

      if (!sessionToken) {
        return res.status(400).json({
          success: false,
          message: "Session token is required",
        });
      }

      const session = await SignupSession.findOne({
        sessionToken,
        expiresAt: { $gt: new Date() },
      });

      if (!session) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired session token",
        });
      }

      (req as any).signupSession = session;
      next();
    };
  }

  static validateResetToken() {
    return (req: Request, res: Response, next: NextFunction) => {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Reset token is required",
        });
      }

      if (token.length !== 64) {
        return res.status(400).json({
          success: false,
          message: "Invalid reset token format",
        });
      }

      next();
    };
  }

  static authenticate() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication token required",
        });
      }

      try {
        const decoded = jwt.verify(token, config.app.app_secret) as any;

        const user = await UserModel.findById(decoded.userId).select(
          "email firstName lastName avatar isActive isEmailVerified roles authMethods"
        );

        if (!user) {
          return res.status(401).json({
            success: false,
            message: "User not found",
          });
        }

        if (!user.isActive) {
          return res.status(403).json({
            success: false,
            message: "Account is deactivated",
          });
        }

        const loginableRoles = user.roles.filter((role) => role.canLogin);

        if (loginableRoles.length === 0) {
          return res.status(403).json({
            success: false,
            message: "No loginable roles assigned",
          });
        }

        (req as any).user = {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          roles: loginableRoles,
          isEmailVerified: user.isEmailVerified,
          authMethods: user.authMethods,
        };

        next();
      } catch (error) {
        if (error === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Token expired",
          });
        }

        return res.status(401).json({
          success: false,
          message: "Invalid authentication token",
        });
      }
    };
  }

  static requireVerifiedEmail() {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;

      if (!user.isEmailVerified) {
        return res.status(403).json({
          success: false,
          message: "Email verification required",
        });
      }

      next();
    };
  }

  static requireProfileCompletion() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;

      const fullUser = await User.findById(user._id);

      if (!fullUser?.isProfileComplete) {
        return res.status(403).json({
          success: false,
          message: "Profile completion required",
        });
      }

      next();
    };
  }

  static requireRole(requiredRoles: string | string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      const roles = Array.isArray(requiredRoles)
        ? requiredRoles
        : [requiredRoles];

      const hasRole = user.roles.some((userRole: any) =>
        roles.includes(userRole.name)
      );

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: `Required role(s): ${roles.join(", ")}`,
        });
      }

      next();
    };
  }

  static requireLevel(minLevel: number) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;

      const maxLevel = Math.max(...user.roles.map((r: any) => r.level));

      if (maxLevel < minLevel) {
        return res.status(403).json({
          success: false,
          message: `Required minimum level: ${minLevel}`,
        });
      }

      next();
    };
  }

  static signupRateLimit() {
    return signupRateLimit;
  }

  static loginRateLimit() {
    return loginRateLimit;
  }

  static verificationRateLimit() {
    return verificationRateLimit;
  }
}
