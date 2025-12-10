import { Router } from "express";
import { getRolesForSignup } from "../services/can.sign.up";
import { createRole } from "../services/create.roles";


export const roleRouter = Router();

roleRouter.get("/signupallowedpersonalities", getRolesForSignup)
roleRouter.post("/create", createRole)

