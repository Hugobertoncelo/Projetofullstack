import express from "express";
import { validateJWT } from "../middleware/auth";
import * as authController from "../controllers/authController";
const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", validateJWT, authController.getMe);
router.post("/setup-2fa", validateJWT, authController.setup2FA);
router.post("/verify-2fa", validateJWT, authController.verify2FA);
router.post("/disable-2fa", validateJWT, authController.disable2FA);
router.post("/change-password", validateJWT, authController.changePassword);
router.post("/logout", validateJWT, authController.logout);

export { router as authRoutes };
