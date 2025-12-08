import { Request, Response, Router } from "express";
// import { AuthController } from "@api/auth/auth.controller";
// import { checkRole, Role } from "@core/middleware/rbac";
import mongoose from "mongoose"; 
import { ApiResponse } from "../../CORE/utils/apiresponse";
const router = Router();

/**
 * @swagger
 * /auth/login:
 * post:
 * summary: User login
 * tags: [Auth]
 * responses:
 * 200:
 * description: Login successful
 */
// router.post("/auth/login", app.use('/api/v1/auth', RateLimiter.api({
//     windowMs: 15 * 60 * 1000, 
//     max: 5,
//     message: "Too many login attempts, please try again in 15 minutes"
// })), AuthController.login);

// router.get("/admin/dashboard", checkRole([Role.SUPER_ADMIN], 5), (req, res) => {
//   res.json({ msg: "Welcome Level 5 Super Admin" });
// });

/**
 * @swagger
 * /health:
 * get:
 * summary: Check system health and database connection
 * tags: [Health]
 * responses:
 * 200:
 * description: System is healthy
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status:
 * type: integer
 * example: 200
 * message:
 * type: string
 * example: System is healthy
 * data:
 * type: object
 * properties:
 * server:
 * type: string
 * example: UP
 * database:
 * type: string
 * example: UP
 * timestamp:
 * type: string
 * 503:
 * description: Service Unavailable (Database Down)
 */

router.get("/health", async (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const isDbUp = dbState === 1;

  const healthData = {
    server: "UP",
    database: isDbUp ? "UP" : "DOWN",
    timestamp: new Date().toISOString(),
  };

  if (!isDbUp) {
    return ApiResponse.error(res, "Service Unavailable", 503, healthData);
  }

  return ApiResponse.success(res, healthData, "System is healthy");
});

export default router;
