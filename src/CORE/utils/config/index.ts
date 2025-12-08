import dotenv from "dotenv";
import path from "path";

const env = process.env.NODE_ENV || "development";
const envPath = path.resolve(process.cwd(), `.env.${env}`);

dotenv.config({ path: envPath });

type APP= {
  port: string,
  env:string
}

type DB = {
  mongoUri:string
}

type Config ={
  app: APP
  db:DB
}

export const config:Config= {
  app: {
    port: process.env.PORT!,
    env: env,
  },
  db: {
    mongoUri: process.env.MONGO_URI!
  }
};
