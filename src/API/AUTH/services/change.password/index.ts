import {
  CHANGE_PASSWORD,
  LOGOUT_SUCCESSFUL,
  PROFILE_FETCHED_SUCCESSFUL,
  PROFILE_UPDATED_SUCCESSFUL,
} from "../../../../CORE/constants";
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

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    Logger.info(`Password changed - User: ${user.email}, IP: ${ipAddress}`);
    await ApiResponse.success(res, {}, CHANGE_PASSWORD, 202);

  
  } catch (error) {
    Logger.error(
      `Password change failed - User: ${(req as any).user?.email}, IP: ${
        req.ip
      }, Error: ${error}`
    );
    next(error);
  }
};
