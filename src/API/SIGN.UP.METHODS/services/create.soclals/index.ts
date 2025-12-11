import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../../CORE/utils/apiresponse";
import { Socials } from "../../model";
import { SOCIALS_CREATED } from "../../../../CORE/constants";
import { AppError } from "../../../../CORE/utils/errorhandler";

export const createSocials = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body) {
      throw new AppError(400, "Request body is empty");
    }
    const roles = await Socials.create(req.body);
    await ApiResponse.success(res, roles, SOCIALS_CREATED, 202);
  } catch (error) {
    next(error);
  }
};
