import dotenv from "dotenv";
import path from "path";

const env = process.env.NODE_ENV || "development";
const envPath = path.resolve(process.cwd(), `.env.${env}`);

dotenv.config({ path: envPath });

type APP = {
  port: string;
  env: string;
};

type DB = {
  mongoUri: string;
};
type Google = {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  scope: Array<string>;
};
type Github = {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  scope: Array<string>;
};
type Facebook = {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  scope: Array<string>;
};
type Config = {
  app: APP;
  db: DB;
  google: Google;
  facebook: Facebook;
  github: Github;
};

export const config: Config = {
  app: {
    port: process.env.PORT!,
    env: env,
  },
  db: {
    mongoUri: process.env.MONGO_URI!,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || " ",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || " ",
    callbackURL: "/api/v1/auth/google/callback",
    scope: ["profile", "email"],
  },
  facebook: {
    clientId: process.env.FACEBOOK_APP_ID || " ",
    clientSecret: process.env.FACEBOOK_APP_SECRET || " ",
    callbackURL: "/api/v1/auth/facebook/callback",
    scope: ["email", "public_profile"],
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || " ",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || " ",
    callbackURL: "/api/v1/auth/github/callback",
    scope: ["user:email"],
  },
};
