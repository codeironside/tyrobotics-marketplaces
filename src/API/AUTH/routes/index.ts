import express from "express";

import { SecurityMiddleware } from "../../../CORE/middlewares/security.middleware";
import { initiateSocialSignup } from "../services/inititaite.social.sign.up";
import { completeSocialSignup } from "../services/complete.social.sign.up";
import { initiateEmailSignup } from "../services/initiate.email.sign.up";
import { completeEmailSignup } from "../services/complete.email.sign.up";
import { completeProfile } from "../services/complete.profile";
import { verifyEmail } from "../services/verify.email";
import { resendVerification } from "../services/resend.verification";
import { checkEmailAvailability } from "../services/check.email.availability";
import { checkUsernameAvailability } from "../services/check.user.name.available";
import { socialLogin } from "../services/social.login";
import { emailLogin } from "../services/email.log.in";
import { logout } from "../services/logout";
import { getProfile } from "../services/get.profille";
import { updateProfile } from "../services/update.profile";
import { changePassword } from "../services/change.password";
import { getAuthMethods } from "../services/getAUthmethods";
import { linkAuthMethod } from "../services/link.auth.method";
import { unlinkAuthMethod } from "../services/unlink.auth.method";
import { forgotPassword } from "../services/forgot.password";
import { resetPassword } from "../services/reset.password";

const authRouter = express.Router();


authRouter.post(
  "/signup/social/initiate",
  SecurityMiddleware.validateProvider,
  initiateSocialSignup
);

authRouter.post(
  "/signup/social/complete",
  SecurityMiddleware.validateSessionToken(),
  SecurityMiddleware.validateRoleSelection(),
 completeSocialSignup
);

authRouter.post(
  "/signup/email/initiate",
  SecurityMiddleware.validateEmail,
  SecurityMiddleware.validateRoleSelection(),
  initiateEmailSignup
);

authRouter.post(
  "/signup/email/complete",
  SecurityMiddleware.validateSessionToken(),
  completeEmailSignup
);

authRouter.post(
  "/signup/profile/complete",
  SecurityMiddleware.authenticate(),
  completeProfile
);

authRouter.post("/signup/verify-email", verifyEmail);

authRouter.post(
  "/signup/resend-verification",
  SecurityMiddleware.validateEmail,
  resendVerification
);

authRouter.post(
  "/signup/check-email",
  SecurityMiddleware.validateEmail,
  checkEmailAvailability
);

authRouter.post("/signup/check-username", checkUsernameAvailability);

authRouter.post(
  "/login/social",
  SecurityMiddleware.validateProvider,
  socialLogin
);

authRouter.post(
  "/login/email",
  SecurityMiddleware.validateEmail,
  SecurityMiddleware.validatePassword(),
  emailLogin
);

authRouter.post(
  "/logout",
  SecurityMiddleware.authenticate(),
  logout
);

authRouter.get(
  "/profile",
  SecurityMiddleware.authenticate(),
  getProfile
);

authRouter.put(
  "/profile",
  SecurityMiddleware.authenticate(),
  updateProfile
);

authRouter.put(
  "/profile/password",
  SecurityMiddleware.authenticate(),
  SecurityMiddleware.validatePassword(),
  changePassword
);

authRouter.get(
  "/auth-methods",
  SecurityMiddleware.authenticate(),
  getAuthMethods
);

authRouter.post(
  "/auth-methods/link",
  SecurityMiddleware.authenticate,
  SecurityMiddleware.validateProvider,
  linkAuthMethod
);

authRouter.delete(
  "/auth-methods/:methodId",
  SecurityMiddleware.authenticate(),
  unlinkAuthMethod
);

authRouter.post(
  "/forgot-password",
  SecurityMiddleware.validateEmail,
  forgotPassword
);

authRouter.post(
  "/reset-password",
  SecurityMiddleware.validateResetToken(),
  SecurityMiddleware.validatePassword(),
  resetPassword
);

export default authRouter;
