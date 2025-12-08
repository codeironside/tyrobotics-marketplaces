// import "module-alias/register";
import { Server } from "http";
import app from "../APP-modules";
import { config } from "../../CORE/utils/config";
import { Logger } from "../../CORE/utils/logger";
import { Database } from "../../CORE/service/db";

let server: Server;

const startServer = async () => {
  try {
    await Database.connect();

    server = app.listen(config.app.port, () => {
      Logger.info(`Server running on port ${config.app.port}`);
    });
  } catch (error) {
    Logger.error("Failed to start server");
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  Logger.info(`${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      Logger.info("HTTP server closed.");
      await Database.disconnect();
      Logger.info("Process exiting...");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("uncaughtException", (err: Error) => {
  Logger.error(`Uncaught Exception: ${err.message}`);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason: any) => {
  Logger.error(`Unhandled Rejection: ${reason}`);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
