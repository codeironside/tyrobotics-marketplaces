import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { SignupService } from "../../../SIGNUPSERVICE/model";
import { SocialAuthService } from "../../../../CORE/service/social.service";
import { User } from "../../model";
import { Roles } from "../../../ROLES/model";
import { AppError } from "../../../../CORE/utils/errorhandler";
import { Logger } from "../../../../CORE/utils/logger";
import { ApiResponse } from "../../../../CORE/utils/apiresponse";
import {
  RESEND_VERIFICATION,
  SOCIAL_SIGN_UP_COMPLETED,
} from "../../../../CORE/constants";

export const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip;

    Logger.warn(
      `Resend verification request - Email: ${email}, IP: ${ipAddress}`
    );

    await SignupService.resendVerification(email, req);

    Logger.info(
      `Verification email resent - Email: ${email}, IP: ${ipAddress}`
    );
    await ApiResponse.success(res, {}, RESEND_VERIFICATION, 200);
  } catch (error) {
    Logger.error(
      `Resend verification failed - Email: ${req.body.email}, IP: ${req.ip}, Error: ${error}`
    );
    next(error);
  }
};
