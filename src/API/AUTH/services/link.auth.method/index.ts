import {
  CHANGE_PASSWORD,
  GET_AUTH,
  LINK_AUTH,
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

export const linkAuthMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    const { provider, code } = req.body;
    const ipAddress = req.ip;

    const result = await SignupService.linkAuthMethod(
      user._id,
      provider,
      code,
      req
    );

    Logger.info(
      `Auth method linked - User: ${user.email}, Provider: ${provider}, IP: ${ipAddress}`
    );

    await ApiResponse.success(res, result, LINK_AUTH, 202);
  } catch (error) {
    Logger.error(
      `Auth method link failed - User: ${(req as any).user?.email}, Provider: ${
        req.body.provider
      }, IP: ${req.ip}, Error: ${error}`
    );
    next(error);
  }
};
