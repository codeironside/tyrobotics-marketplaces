import { Request, Response, NextFunction } from "express";
import { Logger } from "CORE/utils/logger";

export class RequestLogger {
  /**
   * Middleware to log requests and detect basic threats.
   */
  public static log(req: Request, res: Response, next: NextFunction) {
    const ip = RequestLogger.getTrueClientIp(req);
    const userAgent = req.get("user-agent") || "unknown";
    const method = req.method;
    const url = req.originalUrl;

  
    const threat = RequestLogger.detectThreats(req);

    const meta = {
      ip,
      method,
      url,
      userAgent,
      ...(threat && { threatType: threat, risk: "HIGH" }),
    };

  
    if (threat) {
      Logger.warn(
        `[THREAT DETECTED] Suspicious ${threat} attempt from IP: ${ip} on ${method} ${url}`
      );
    } else {
      Logger.http(`Incoming Request: ${method} ${url} - IP: ${ip}`);
    }

    (req as any).clientIp = ip;

    next();
  }

  /**
   * Extracts the True IP address, prioritizing headers set by
   * Cloudflare, Load Balancers, and Reverse Proxies.
   */
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

  /**
   * Scans Query Params and Body for common attack signatures.
   * Returns the type of threat found, or null.
   */
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
