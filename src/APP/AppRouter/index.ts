import { Request, Response, Router } from "express";
import mongoose from "mongoose";
import { ApiResponse } from "../../CORE/utils/apiresponse";
import { roleRouter } from "../../API/ROLES/routes";
import { socialRouter } from "../../API/SIGN.UP.METHODS/routes";
const router = Router();

/**
 * @swagger
 * /heath:
 *   get:
 *     summary: Check system health and database connection
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: System is healthy
 *                 data:
 *                   type: object
 *                   properties:
 *                     server:
 *                       type: string
 *                       example: UP
 *                     database:
 *                       type: string
 *                       example: UP
 *                     timestamp:
 *                       type: string
 *       503:
 *         description: Service Unavailable (Database Down)
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

router.use("/roles", roleRouter);
router.use("/socials", socialRouter);

export default router;
