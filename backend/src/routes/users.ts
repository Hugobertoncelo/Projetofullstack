import express from "express";
import { validateJWT } from "../middleware/auth";
import * as userController from "../controllers/userController";
const router = express.Router();

router.get("/", validateJWT, userController.getUsers);
router.get("/search", validateJWT, userController.searchUsers);
router.get("/:userId", validateJWT, userController.getUserById);
router.put("/me", validateJWT, userController.updateMe);
router.post("/:userId/block", validateJWT, userController.blockUser);
router.delete("/:userId/block", validateJWT, userController.unblockUser);
router.get("/me/stats", validateJWT, userController.getMyStats);

export { router as userRoutes };
