// import express from "express";
// import { AuthController } from "../controllers/auth.controller";
// import { SecurityMiddleware } from "../middleware/security.middleware";

// const router = express.Router();

// router.get("/signup/roles", AuthController.getSignupRoles);
// router.get(
//   "/signup/required-fields/:roleNames",
//   AuthController.getRequiredFields
// );

// router.post(
//   "/signup/social/initiate",
//   SecurityMiddleware.validateProvider(),
//   AuthController.initiateSocialSignup
// );

// router.post(
//   "/signup/social/complete",
//   SecurityMiddleware.validateSessionToken(),
//   SecurityMiddleware.validateRoleSelection(),
//   AuthController.completeSocialSignup
// );

// router.post(
//   "/signup/email/initiate",
//   SecurityMiddleware.validateEmail(),
//   SecurityMiddleware.validateRoleSelection(),
//   AuthController.initiateEmailSignup
// );

// router.post(
//   "/signup/email/complete",
//   SecurityMiddleware.validateSessionToken(),
//   AuthController.completeEmailSignup
// );

// router.post(
//   "/signup/profile/complete",
//   SecurityMiddleware.authenticate(),
//   AuthController.completeProfile
// );

// router.post("/signup/verify-email", AuthController.verifyEmail);

// router.post(
//   "/signup/resend-verification",
//   SecurityMiddleware.validateEmail(),
//   AuthController.resendVerification
// );

// router.post(
//   "/signup/check-email",
//   SecurityMiddleware.validateEmail(),
//   AuthController.checkEmailAvailability
// );

// router.post("/signup/check-username", AuthController.checkUsernameAvailability);

// router.post(
//   "/login/social",
//   SecurityMiddleware.validateProvider(),
//   AuthController.socialLogin
// );

// router.post(
//   "/login/email",
//   SecurityMiddleware.validateEmail(),
//   SecurityMiddleware.validatePassword(),
//   AuthController.emailLogin
// );

// router.post(
//   "/logout",
//   SecurityMiddleware.authenticate(),
//   AuthController.logout
// );

// router.get(
//   "/profile",
//   SecurityMiddleware.authenticate(),
//   AuthController.getProfile
// );

// router.put(
//   "/profile",
//   SecurityMiddleware.authenticate(),
//   AuthController.updateProfile
// );

// router.put(
//   "/profile/password",
//   SecurityMiddleware.authenticate(),
//   SecurityMiddleware.validatePassword(),
//   AuthController.changePassword
// );

// router.get(
//   "/auth-methods",
//   SecurityMiddleware.authenticate(),
//   AuthController.getAuthMethods
// );

// router.post(
//   "/auth-methods/link",
//   SecurityMiddleware.authenticate(),
//   SecurityMiddleware.validateProvider(),
//   AuthController.linkAuthMethod
// );

// router.delete(
//   "/auth-methods/:methodId",
//   SecurityMiddleware.authenticate(),
//   AuthController.unlinkAuthMethod
// );

// router.post(
//   "/forgot-password",
//   SecurityMiddleware.validateEmail(),
//   AuthController.forgotPassword
// );

// router.post(
//   "/reset-password",
//   SecurityMiddleware.validateResetToken(),
//   SecurityMiddleware.validatePassword(),
//   AuthController.resetPassword
// );

// export default router;
