import { Router } from "express"
import { createSocials } from "../services/create.soclals"
import { getSocialsForLogin } from "../services/get.login.socials"
import { getSocialsForSignUp } from "../services/get.signup.socials"



export const socialRouter = Router()



socialRouter.post("/", createSocials)
socialRouter.get("/login", getSocialsForLogin)
socialRouter.get("/signup", getSocialsForSignUp)