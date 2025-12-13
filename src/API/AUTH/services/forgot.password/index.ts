import {
  CHANGE_PASSWORD,
  FORGOT_PASSWORD,
  GET_AUTH,
  LINK_AUTH,
  LOGOUT_SUCCESSFUL,
  PROFILE_FETCHED_SUCCESSFUL,
  PROFILE_UPDATED_SUCCESSFUL,
  UN_LINK_AUTH,
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

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip;

    await SignupService.forgotPassword(email, req);

    Logger.warn(`Password reset requested - Email: ${email}, IP: ${ipAddress}`);
    await ApiResponse.success(res, {}, FORGOT_PASSWORD, 202);
  } catch (error) {
    Logger.error(
      `Password reset request failed - Email: ${req.body.email}, IP: ${req.ip}, Error: ${error}`
    );
    next(error);
  }
};
