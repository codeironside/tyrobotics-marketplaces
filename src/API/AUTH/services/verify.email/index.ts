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
  SEND_VERIFICATION,
  SOCIAL_SIGN_UP_COMPLETED,
} from "../../../../CORE/constants";

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, otpCode } = req.body;
    const ipAddress = req.ip;

    Logger.warn(
      `Email verification attempt - Token: ${token}, IP: ${ipAddress}`
    );

    const result = await SignupService.verifyEmail(token, req, otpCode);

    Logger.info(
      `Email verification successful - User: ${result.user.email}, IP: ${ipAddress}`
    );
    const data = {
      user: result.user,
      token: result.token,
    };
    await ApiResponse.success(res, data, SEND_VERIFICATION, 202);
  } catch (error) {
    console.error(
      `Email verification failed - Token: ${req.body.token}, IP: ${req.ip}, Error: ${error}`
    );
    next(error);
  }
};
