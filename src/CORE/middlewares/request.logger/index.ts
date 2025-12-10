import { Request, Response, NextFunction } from "express";
import { Logger } from "../../utils/logger";
const TerminalColors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  crimson: "\x1b[38;5;196m",
};

export class RequestLogger {
  public static log(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const ip = RequestLogger.getTrueClientIp(req);
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.get("user-agent") || "unknown";

    const threat = RequestLogger.detectThreats(req);

    if (threat) {
      const color = RequestLogger.getThreatColor(threat);
      const timestamp = new Date().toISOString();
      const icon = "⚠️";

      console.log(
        `${color}${icon} [${timestamp}] THREAT: ${threat} | IP: ${ip} | ${method} ${url}${TerminalColors.reset}`
      );

      Logger.warn(`[THREAT] ${threat} | IP: ${ip} | ${method} ${url}`);
      (req as any).threatDetected = true;
    }

    (req as any).clientIp = ip;

    res.on("finish", () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const statusColor = RequestLogger.getStatusColor(status);
      const timestamp = new Date().toISOString();

      const logMessage = `${statusColor}[${timestamp}] ${method} ${url} ${status} - ${duration}ms | IP: ${ip}${TerminalColors.reset}`;

      console.log(logMessage);

      if (status >= 500) {
        Logger.error(
          `Request Failed: ${method} ${url} ${status} - ${duration}ms`
        );
      } else if (status >= 400) {
        Logger.warn(`Client Error: ${method} ${url} ${status} - ${duration}ms`);
      } else {
        Logger.http(`${method} ${url} ${status} - ${duration}ms`);
      }
    });

    next();
  }

  private static getStatusColor(status: number): string {
    if (status >= 500) return TerminalColors.red;
    if (status >= 400) return TerminalColors.yellow;
    if (status >= 300) return TerminalColors.cyan;
    if (status >= 200) return TerminalColors.green;
    return TerminalColors.white;
  }

  private static getThreatColor(threatType: string): string {
    switch (threatType) {
      case "SQL_INJECTION_SUSPECT":
      case "SQL_INJECTION_KEYWORD":
        return TerminalColors.red;
      case "XSS_ATTEMPT":
        return TerminalColors.magenta;
      case "PATH_TRAVERSAL":
        return TerminalColors.yellow;
      default:
        return TerminalColors.crimson;
    }
  }

  private static getTrueClientIp(req: Request): string {
    const headers = req.headers;

    if (headers["cf-connecting-ip"])
      return headers["cf-connecting-ip"] as string;
    if (headers["true-client-ip"]) return headers["true-client-ip"] as string;

    const xForwardedFor = headers["x-forwarded-for"];
    if (xForwardedFor) {
      const ips = (xForwardedFor as string).split(",").map((ip) => ip.trim());
      if (ips.length > 0) return ips[0];
    }

    return req.ip || req.socket.remoteAddress || "0.0.0.0";
  }

  private static detectThreats(req: Request): string | null {
    const payloads = [JSON.stringify(req.query), JSON.stringify(req.body)]
      .join(" ")
      .toLowerCase();

    if (
      payloads.match(/(\%27)|(\')|(\-\-)|(\%23)|(#)/i) &&
      payloads.match(/((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i)
    ) {
      return "SQL_INJECTION_SUSPECT";
    }

    if (payloads.match(/(union|select|insert|delete|update|drop|alter)/i)) {
      return "SQL_INJECTION_KEYWORD";
    }

    if (payloads.match(/(<script>|javascript:|on\w+=)/i)) {
      return "XSS_ATTEMPT";
    }

    if (payloads.includes("../") || payloads.includes("..\\")) {
      return "PATH_TRAVERSAL";
    }

    return null;
  }
}