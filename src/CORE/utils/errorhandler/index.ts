import { Request, Response, NextFunction } from "express";
import { Logger } from "../logger";
import { ApiResponse } from "../apiresponse";

export class AppError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export const ErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Logger.error(err.message);

  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode);
  }

  return ApiResponse.error(
    res,
    "Internal Server Error",
    500,
    process.env.NODE_ENV === "development" ? err : {}
  );
};
