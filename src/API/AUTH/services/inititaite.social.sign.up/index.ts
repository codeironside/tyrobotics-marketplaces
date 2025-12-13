import { Request, Response, NextFunction } from "express";

import { SignupService } from "../../../SIGNUPSERVICE/model";

import { Logger } from "../../../../CORE/utils/logger";
import { ApiResponse } from "../../../../CORE/utils/apiresponse";
import { SIGN_UP_INITIATED } from "../../../../CORE/constants";

export const  initiateSocialSignup = async(
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { provider, code } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers["user-agent"];

      const result = await SignupService.initiateSocialSignup(
        provider,
        code,
        req
      );
      let data = {
        sessionToken: result.sessionToken,
        userInfo: {
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          avatar: result.avatar,
        },
      };
      await ApiResponse.success(res, data, SIGN_UP_INITIATED, 202);
      Logger.info(
        `Social signup initiated - Provider: ${provider}, IP: ${ipAddress}`
      );
      } catch (error) {
    
      Logger.error(
        `Social signup initiation failed - Provider: ${req.body.provider}, IP: ${req.ip}, Error: ${error}`
      );
      next(error);
    }
  }