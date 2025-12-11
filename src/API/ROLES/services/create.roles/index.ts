import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../../CORE/utils/apiresponse";
import { Roles } from "../../model";
import { ROLE_CREATED } from "../../../../CORE/constants";
import { AppError } from "../../../../CORE/utils/errorhandler";

export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
      if (!req.body) {
        throw new AppError(400, "Request body is empty");
      }
    const roles = await Roles.create(req.body);
    await ApiResponse.success(res, roles, ROLE_CREATED, 202);
  } catch (error) {
      next(error)
  }
};
