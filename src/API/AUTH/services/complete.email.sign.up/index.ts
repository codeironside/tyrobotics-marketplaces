import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { SignupService } from "../../../SIGNUPSERVICE/model";
import { SocialAuthService } from "../../../../CORE/service/social.service";
import { User } from "../../../AUTH/model";
import { Roles } from "../../../ROLES/model";
import { AppError } from "../../../../CORE/utils/errorhandler";
import { Logger } from "../../../../CORE/utils/logger";
import { ApiResponse } from "../../../../CORE/utils/apiresponse";
import {
  EMAIL_SIGN_UP_COMPLETED,
  SOCIAL_SIGN_UP_COMPLETED,
} from "../../../../CORE/constants";

export const completeEmailSignup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionToken, verificationCode, roleNames } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];

    Logger.warn(
      `Social signup completion attempt - Session: ${sessionToken}, Roles: ${roleNames}, IP: ${ipAddress}`
    );

    const result = await SignupService.completeEmailSignup(
      sessionToken,
      verificationCode,
      roleNames,
      req
    );

    Logger.info(
      `Email signup completed successfully - User: ${result.user.email}, Roles: ${roleNames}, IP: ${ipAddress}`
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
    const status = result.requiresProfileCompletion ? 200 : 201;
    await ApiResponse.success(
      res,
      responseData,
      EMAIL_SIGN_UP_COMPLETED,
      status
    );
  } catch (error) {
    Logger.error(
      `Email signup completion failed - Session: ${req.body.sessionToken}, IP: ${req.ip}, Error: ${error}`
    );
    next(error);
  }
};
