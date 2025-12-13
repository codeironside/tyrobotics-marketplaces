import {
  CHANGE_PASSWORD,
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
export const unlinkAuthMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    const { methodId } = req.params;
    const ipAddress = req.ip;

    await SignupService.unlinkAuthMethod(user._id, methodId, req);

    Logger.info(
      `Auth method unlinked - User: ${user.email}, Method ID: ${methodId}, IP: ${ipAddress}`
    );

    await ApiResponse.success(res, {}, UN_LINK_AUTH, 202);
  } catch (error) {
    next(error);
  }
};
