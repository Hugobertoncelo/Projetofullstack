import express from "express";
import { validateJWT } from "../middleware/auth";
import * as conversationController from "../controllers/conversationController";
const router = express.Router();

router.get("/", validateJWT, conversationController.getConversations);
router.get(
  "/:conversationId",
  validateJWT,
  conversationController.getConversationById
);
router.post(
  "/direct",
  validateJWT,
  conversationController.createDirectConversation
);
router.post(
  "/group",
  validateJWT,
  conversationController.createGroupConversation
);
router.post(
  "/:conversationId/members",
  validateJWT,
  conversationController.addGroupMembers
);
router.delete(
  "/:conversationId/members/:userId",
  validateJWT,
  conversationController.removeGroupMember
);
router.put("/:conversationId", validateJWT, conversationController.updateGroup);
router.delete(
  "/:conversationId",
  validateJWT,
  conversationController.deleteConversation
);

export { router as conversationRoutes };
