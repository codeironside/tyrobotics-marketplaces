import { Request, Response, NextFunction } from "express";
import { SignupService } from "../../../SIGNUPSERVICE/model";
import { Logger } from "../../../../CORE/utils/logger";
import { ApiResponse } from "../../../../CORE/utils/apiresponse";
import {
    EMAIL_SIGN_UP_INITIATED,
  SOCIAL_SIGN_UP_COMPLETED,
} from "../../../../CORE/constants"; 
import { loggers } from "winston";
 
 
export const  initiateEmailSignup = async(
    req: Request,
    res: Response,
    next: NextFunction
  )=> {
    try {
      const { email, password, roleNames } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers["user-agent"];

      Logger.warn(`Email signup initiated - Email: ${email}, IP: ${ipAddress}`);

      const result = await SignupService.initiateEmailSignup(
        email,
        password,
        roleNames,
        req
      );
const data =   {
          sessionToken: result.sessionToken,
          message: "Verification email sent. Please check your inbox.",
        }
    await ApiResponse.success(
      res,
      data,
      EMAIL_SIGN_UP_INITIATED,
    202
    );

    } catch (error) {
      Logger.error(
        `Email signup initiation failed - Email: ${req.body.email}, IP: ${req.ip}, Error: ${error}`
      );
      next(error);
    }
  }