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
import {
  SOCIAL_SIGN_UP_COMPLETED,
} from "../../../../CORE/constants";

export const completeSocialSignup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionToken, roleNames } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];

    Logger.warn(
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

    Logger.info(
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
    const status = result.requiresProfileCompletion ? 200 : 201;
    await ApiResponse.success(
      res,
      responseData,
      SOCIAL_SIGN_UP_COMPLETED,
      status
    );
  } catch (error) {
    Logger.error(
      `Social signup completion failed - Session: ${req.body.sessionToken}, IP: ${req.ip}, Error: ${error}`
    );
    next(error);
  }
};
