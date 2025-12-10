import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../../CORE/utils/apiresponse";
import { Roles } from "../../model";
import { ROLE_CREATED } from "../../../../CORE/constants";

export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { data } = req.body;
    const roles = await Roles.create(data);
    await ApiResponse.success(res, roles, ROLE_CREATED, 202);
  } catch (error) {
      next(error)
  }
};
