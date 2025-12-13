import dotenv from "dotenv";
import path from "path";

const env = process.env.NODE_ENV || "development";
const envPath = path.resolve(process.cwd(), `.env.${env}`);

dotenv.config({ path: envPath });
type Termii = {
  api_key: string;
  senderId: string;
  base_url_sms: string;
  base_url_whatsapp: string;

};

type Resend = {
  api_key: string;
  from: string;
};
type APP = {
  port: string;
  env: string;
  app_secret: string;
  expires_in: string;
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
  resend: Resend;
  termii: Termii;
};

export const config: Config = {
  app: {
    port: process.env.PORT!,
    env: env,
    app_secret: process.env.APP_SECRET!,
    expires_in: process.env.EXPIRES_IN!,
  },
  db: {
    mongoUri: process.env.MONGO_URI!,
  },
  resend: {
    api_key: process.env.RESEND_API_KEY!,
    from: process.env.RESEND_FROM!,
  },
  termii: {
    base_url_sms: process.env.BASE_URL_SMS!,
    base_url_whatsapp: process.env.BASE_URL_WHATSAPP!,
    senderId: process.env.TERMII_SENDER_ID || "",
    api_key: process.env.TERMII_API_KEY!,
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
