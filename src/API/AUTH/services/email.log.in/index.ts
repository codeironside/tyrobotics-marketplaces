import { LOGIN_SUCCESSFUL } from "../../../../CORE/constants";
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


export const emailLogin=  async(req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers["user-agent"];

      Logger.warn(`Email login attempt - Email: ${email}, IP: ${ipAddress}`);

      const result = await SignupService.emailLogin(email, password, req);

  

      Logger.info(
        `Email login successful - User: ${result.user.email}, IP: ${ipAddress}`
      );
await ApiResponse.success(res, result, LOGIN_SUCCESSFUL, 202);

    } catch (error) {
      Logger.error(
        `Email login failed - Email: ${req.body.email}, IP: ${req.ip}, Error: ${error}`
      );
      next(error);
    }
  }