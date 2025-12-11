import { Router } from "express";
import { getRolesForSignup } from "../services/can.sign.up";
import { createRole } from "../services/create.roles";
import { getRolesForLogin } from "../services/can.log.in";


export const roleRouter = Router();

roleRouter.get("/signupallowedpersonalities", getRolesForSignup)
roleRouter.get("/signupallowedpersonalities", getRolesForLogin)
roleRouter.post("/create", createRole)

