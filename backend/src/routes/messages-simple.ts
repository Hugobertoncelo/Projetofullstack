import express from "express";
import { validateJWT } from "../middleware/auth";
import * as messageController from "../controllers/messageController";
const router = express.Router();

router.get(
  "/conversation/:conversationId",
  validateJWT,
  messageController.getMessagesByConversation
);
router.get("/search", validateJWT, messageController.searchMessages);
router.put("/:messageId", validateJWT, messageController.updateMessage);
router.delete("/:messageId", validateJWT, messageController.deleteMessage);
router.post(
  "/conversation/:conversationId",
  validateJWT,
  messageController.createMessage
);

export { router as messageRoutes };
