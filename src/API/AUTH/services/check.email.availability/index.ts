import { EMAIL_AVAILAIBLE } from "../../../../CORE/constants";
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
export const checkEmailAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    const existingUser = await User.findByEmail(email);
    const data = {
      available: !existingUser,
      email,
    };
    await ApiResponse.success(res, data, EMAIL_AVAILAIBLE, 202);
  } catch (error) {
    next(error);
  }
};
