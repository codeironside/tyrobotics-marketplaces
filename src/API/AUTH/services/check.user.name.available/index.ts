import { User_NAME_AVAILAIBLE } from "../../../../CORE/constants";
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
export const checkUsernameAvailability =async(
    req: Request,
    res: Response,
    next: NextFunction
  ) =>{
    try {
      const { username } = req.body;

      if (!username) {
        throw new AppError(400, "Username is required");
      }

        const existingUser = await UserModel.findOne({ username });
        const data = {
          available: !existingUser,
          username,
        };
await ApiResponse.success(res, data, User_NAME_AVAILAIBLE, 202);
    
    } catch (error) {
      next(error);
    }
  }