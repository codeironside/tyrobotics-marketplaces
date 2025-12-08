import { Response } from "express";

export class ApiResponse {
  constructor(
    public status: number,
    public message: string,
    public data: any = null
  ) {}

  public static success(
    res: Response,
    data: any,
    message: string = "Success",
    status: number = 200
  ) {
    return res.status(status).json(new ApiResponse(status, message, data));
  }

  public static error(
    res: Response,
    message: string = "Internal Server Error",
    status: number = 500,
    error: any = null
  ) {
    return res.status(status).json(new ApiResponse(status, message, error));
  }
}
