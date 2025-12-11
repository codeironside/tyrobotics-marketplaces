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
  google_redirect_url: string;
  scope: Array<string>;
  tokenUrl: string;
  userInfoUrl: string;
};
type Github = {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  scope: Array<string>;
  tokenUrl: string;
  userInfoUrl: string;
  github_redirect_url: string;
};
type Facebook = {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  scope: Array<string>;
  tokenUrl: string;
  userInfoUrl: string;
  facebook_redirect_url: string;
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
    google_redirect_url: process.env.GOOGLE_REDIRECT_URI || "",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    scope: ["profile", "email"],
  },
  facebook: {
    clientId: process.env.FACEBOOK_APP_ID || " ",
    clientSecret: process.env.FACEBOOK_APP_SECRET || " ",
    callbackURL: "/api/v1/auth/facebook/callback",
    scope: ["email", "public_profile"],
    tokenUrl: "https://graph.facebook.com/v12.0/oauth/access_token",
    userInfoUrl: "https://graph.facebook.com/v12.0/me",
    facebook_redirect_url: process.env.FACEBOOK_REDIRECT_URI || "",
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || " ",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || " ",
    callbackURL: "/api/v1/auth/github/callback",
    scope: ["user:email"],
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    github_redirect_url: process.env.GITHUB_REDIRECT_URI || "",
  },
};
