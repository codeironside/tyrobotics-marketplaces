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
  PROFILE_COMPLETED,
  SOCIAL_SIGN_UP_COMPLETED,
} from "../../../../CORE/constants";

export const completeProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    const profileData = req.body;
    const ipAddress = req.ip;

    Logger.warn(
      `Profile completion attempt - User: ${user.email}, IP: ${ipAddress}`
    );

    const result = await SignupService.completeProfile(
      user._id,
      profileData,
      req
    );

    Logger.info(
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
    await ApiResponse.success(res, responseData, PROFILE_COMPLETED, 202);
  } catch (error) {
    console.error(
      `Profile completion failed - User: ${(req as any).user?.email}, IP: ${
        req.ip
      }, Error: ${error}`
    );
    next(error);
  }
};
