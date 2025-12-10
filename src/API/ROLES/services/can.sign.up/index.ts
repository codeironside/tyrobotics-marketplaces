import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../../CORE/utils/apiresponse";
import { Roles } from "../../model";
import { ROLES_FETCHED_SUCCESSFUL } from "../../../../CORE/constants";

/**
 * @swagger
 * /roles/signupallowedpersonalities:
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
export const getRolesForSignup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const allRoles = await Roles.canSignUp();
    await ApiResponse.success(res, allRoles, ROLES_FETCHED_SUCCESSFUL, 202);
  } catch (error) {
    next(error);
  }
};
