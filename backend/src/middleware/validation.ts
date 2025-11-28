import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import Logger from "../config/logger";

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    Logger.warn("Validation errors:", {
      errors: errors.array(),
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors.array().map((error) => ({
        field: error.type === "field" ? error.path : "unknown",
        message: error.msg,
      })),
    });
  }
  next();
};

export const validateRegister = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("username")
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      "Username must be 3-30 characters and contain only letters, numbers, and underscores"
    ),
  body("password")
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must be 8+ characters with uppercase, lowercase, number, and special character"
    ),
  body("displayName")
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage("Display name must be 1-50 characters"),
  handleValidationErrors,
];

export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").isLength({ min: 1 }).withMessage("A senha é obrigatória"),
  body("twoFactorCode")
    .optional()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("2FA code must be 6 digits"),
  handleValidationErrors,
];

export const validatePasswordReset = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  handleValidationErrors,
];

export const validatePasswordUpdate = [
  body("token").isLength({ min: 1 }).withMessage("Reset token is required"),
  body("newPassword")
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must be 8+ characters with uppercase, lowercase, number, and special character"
    ),
  handleValidationErrors,
];

export const validateMessage = [
  body("content")
    .isLength({ min: 1, max: 2000 })
    .trim()
    .withMessage("Message content must be 1-2000 characters"),
  body("type")
    .optional()
    .isIn(["TEXT", "IMAGE", "FILE", "SYSTEM"])
    .withMessage("Invalid message type"),
  body("replyToId")
    .optional()
    .isUUID()
    .withMessage("Reply ID must be a valid UUID"),
  handleValidationErrors,
];

export const validateMessageEdit = [
  body("content")
    .isLength({ min: 1, max: 2000 })
    .trim()
    .withMessage("Message content must be 1-2000 characters"),
  handleValidationErrors,
];

export const validateDirectConversation = [
  body("userId").isUUID().withMessage("User ID must be a valid UUID"),
  handleValidationErrors,
];

export const validateGroupConversation = [
  body("name")
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage("Group name must be 1-100 characters"),
  body("userIds")
    .isArray({ min: 1, max: 50 })
    .withMessage("Must select 1-50 users"),
  body("userIds.*").isUUID().withMessage("All user IDs must be valid UUIDs"),
  handleValidationErrors,
];

export const validateUpdateGroup = [
  body("name")
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage("Group name must be 1-100 characters"),
  handleValidationErrors,
];

export const validateAddMembers = [
  body("userIds")
    .isArray({ min: 1, max: 20 })
    .withMessage("Must select 1-20 users to add"),
  body("userIds.*").isUUID().withMessage("All user IDs must be valid UUIDs"),
  handleValidationErrors,
];

export const validateUserUpdate = [
  body("displayName")
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage("Display name must be 1-50 characters"),
  body("avatar").optional().isURL().withMessage("Avatar must be a valid URL"),
  handleValidationErrors,
];

export const validateSearch = [
  body("query")
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage("Search query must be 1-100 characters"),
  body("type")
    .optional()
    .isIn(["messages", "users", "conversations"])
    .withMessage("Invalid search type"),
  body("conversationId")
    .optional()
    .isUUID()
    .withMessage("Conversation ID must be a valid UUID"),
  handleValidationErrors,
];

export const validatePagination = [
  body("page")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("Page must be a positive integer (max 10000)"),
  body("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];
