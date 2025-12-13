import {
  LOGOUT_SUCCESSFUL,
  PROFILE_FETCHED_SUCCESSFUL,
  PROFILE_UPDATED_SUCCESSFUL,
} from "../../../../CORE/constants";
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

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    const updateData = req.body;
    const ipAddress = req.ip;

    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      updateData,
      {
        new: true,
      }
    ).select(
      "-security.passwordHash -security.twoFactorSecret -security.twoFactorRecoveryCodes"
    );
    Logger.warn(`Profile updated - User: ${user.email}, IP: ${ipAddress}`);
    await ApiResponse.success(
      res,
      updatedUser,
      PROFILE_UPDATED_SUCCESSFUL,
      202
    );
  } catch (error) {
    next(error);
  }
};
