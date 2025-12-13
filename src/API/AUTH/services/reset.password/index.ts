import { LOGIN_SUCCESSFUL, RESET_PASSWORD } from "../../../../CORE/constants";
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
import { UserModel } from "../../model/schema";

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, newPassword } = req.body;
    const ipAddress = req.ip;

    const result = await SignupService.resetPassword(token, newPassword, req);

    Logger.info(
      `Password reset completed - User ID: ${result.userId}, IP: ${ipAddress}`
    );
    await ApiResponse.success(res, result, RESET_PASSWORD, 202);
  } catch (error) {
    Logger.error(
      `Password reset failed - Token: ${req.body.token}, IP: ${req.ip}, Error: ${error}`
    );
    next(error);
  }
};
