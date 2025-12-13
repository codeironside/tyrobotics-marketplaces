import { LOGIN_SUCCESSFUL } from "../../../../CORE/constants";
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
import { UserModel } from "../../model/schema";

export const socialLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { provider, code } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];

    Logger.warn(
      `Social login attempt - Provider: ${provider}, IP: ${ipAddress}`
    );
    const result = await SignupService.socialLogin(provider, code, req);
    Logger.info(
      `Social login successful - User: ${result.user.email}, Provider: ${provider}, IP: ${ipAddress}`
    );
    await ApiResponse.success(res, result, LOGIN_SUCCESSFUL, 202);
  } catch (error) {
    Logger.error(
      `Social login failed - Provider: ${req.body.provider}, IP: ${req.ip}, Error: ${error}`
    );
    next(error);
  }
};
