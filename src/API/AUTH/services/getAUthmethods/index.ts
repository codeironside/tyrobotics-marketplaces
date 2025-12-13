import {
  CHANGE_PASSWORD,
  GET_AUTH,
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

export const getAuthMethods = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;

    const fullUser = await User.findById(user._id);
    const data = fullUser?.authMethods || [];
    await ApiResponse.success(res, data, GET_AUTH, 202);
  } catch (error) {
    next(error);
  }
};
