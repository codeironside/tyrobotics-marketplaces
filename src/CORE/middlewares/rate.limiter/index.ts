import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../utils/apiresponse";
import { Logger } from "CORE/utils/logger";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private static store = new Map<string, ClientRecord>();
  private static interval: NodeJS.Timeout;

  private static cleanup() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      const now = Date.now();
      this.store.forEach((record, key) => {
        if (now > record.resetTime) {
          this.store.delete(key);
        }
      });
    }, 60000);
    this.interval.unref();
  }

  public static api(options: RateLimitOptions) {
    this.cleanup();

    return (req: Request, res: Response, next: NextFunction) => {
      const key = (req as any).clientIp || req.ip || "127.0.0.1";
      const now = Date.now();

      let record = this.store.get(key);

      if (!record || now > record.resetTime) {
        record = {
          count: 0,
          resetTime: now + options.windowMs,
        };
        this.store.set(key, record);
      }

      record.count++;

      const remaining = Math.max(0, options.max - record.count);
      const resetTimeDate = new Date(record.resetTime);

      if (options.standardHeaders !== false) {
        res.setHeader("RateLimit-Limit", options.max);
        res.setHeader("RateLimit-Remaining", remaining);
        res.setHeader("RateLimit-Reset", Math.ceil(record.resetTime / 1000));
      }

      if (options.legacyHeaders !== false) {
        res.setHeader("X-RateLimit-Limit", options.max);
        res.setHeader("X-RateLimit-Remaining", remaining);
        res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));
      }

      if (record.count > options.max) {
        const retrySecs = Math.ceil((record.resetTime - now) / 1000);
        res.setHeader("Retry-After", retrySecs);

        Logger.warn(
          `Rate limit exceeded for IP: ${key} on ${req.method} ${req.originalUrl}`
        );

        return ApiResponse.error(
          res,
          options.message || "Too many requests, please try again later",
          options.statusCode || 429
        );
      }

      next();
    };
  }
}
