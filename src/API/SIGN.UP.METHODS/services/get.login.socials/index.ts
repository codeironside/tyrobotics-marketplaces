import { ApiResponse } from "../../../../CORE/utils/apiresponse";
import { Socials } from "../../model";
import { NextFunction, Request, Response } from "express";
import { SOCIALS_FETCHED_SUCCESSFUL } from "../../../../CORE/constants";

export const getSocialsForLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const allSocials = await Socials.canLogin();
    await ApiResponse.success(res, allSocials, SOCIALS_FETCHED_SUCCESSFUL, 200);
  } catch (error) {
    next(error);
  }
};
