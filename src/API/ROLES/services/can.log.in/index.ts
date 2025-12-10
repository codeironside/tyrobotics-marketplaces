import { ApiResponse } from "../../../../CORE/utils/apiresponse";
import { Roles } from "../../model";
import { NextFunction, Request, Response } from "express";
import { ROLES_FETCHED_SUCCESSFUL } from "../../../../CORE/constants";
/**
 * @swagger
 * /roles/signinallowedpersonalities:
 *   get:
 *     summary: check sign up allowed personalities
 *     tags: [ROLES]
 *     responses:
 *       202:
 *         description: Roles fetched successfuly
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 202
 *                 message:
 *                   type: string
 *                   example: ALL ROLES FETCHED
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       503:
 *         description: Server Unavailable
 */
export const getRolesForLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const allRoles = await Roles.canLogin(); 
    await ApiResponse.success(res, allRoles, ROLES_FETCHED_SUCCESSFUL, 200);
  } catch (error) {
    next(error);
  }
};
