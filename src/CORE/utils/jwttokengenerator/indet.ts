import jwt, { Secret } from "jsonwebtoken";
import { AppError } from "../errorhandler";
import { config } from "../config";

type TokenInput = {
  userId: string;
  email: string;
  roles: any[];
  extra?: Record<string, any>;
};

export const generateJwtToken = (data: TokenInput): string => {
  const secret: Secret = config.app.app_secret as Secret;
  if (!secret) throw new AppError(500, "JWT secret not set");

  const expiresIn = (config.app.expires_in ??
    "7d") as jwt.SignOptions["expiresIn"];

  return jwt.sign(
    {
      userId: data.userId,
      email: data.email,
      roles: data.roles,
      ...data.extra,
    },
    secret,
    { expiresIn }
  );
};
