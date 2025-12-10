import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import { config } from "../../CORE/utils/config";
import { ErrorHandler } from "../../CORE/utils/errorhandler";
import router from "../AppRouter";
import { API_VERSION } from "../../CORE/constants";
import { RequestLogger } from "../../CORE/middlewares/request.logger";
import { RateLimiter } from "../../CORE/middlewares/rate.limiter";

const app = express();

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Tyrobotics Marketplaces API",
      version: "1.0.0",
      description: "API Documentation for Tyrobotics Marketplaces",
    },
    servers: [
      {
        url: `http://localhost:${config.app.port}/api/v1`,
      },
    ],
  },
  apis: ["./src/APP/AppRouter/index.ts", "./src/API/**/*.ts"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.set("trust proxy", true);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(RequestLogger.log);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

console.log("api version",API_VERSION)

app.use(API_VERSION,RateLimiter.api({
    windowMs: 15 * 60 * 1000,
    max: 100
}), router);

app.use(ErrorHandler);

export default app;
