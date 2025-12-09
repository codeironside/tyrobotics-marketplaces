import mongoose from "mongoose";
import { Logger } from "../../utils/logger";
import { config } from "../../utils/config";

export class Database {
  public static async connect(): Promise<void> {
    try {
      await mongoose.connect(config.db.mongoUri);
      Logger.info("MongoDB Connected successfully");
    } catch (error) {
      console.log(error)
      Logger.error("MongoDB connection error");
      throw error;
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      Logger.info("MongoDB Disconnected successfully");
    } catch (error) {
      Logger.error("Error disconnecting from MongoDB");
      throw error;
    }
  }
}
