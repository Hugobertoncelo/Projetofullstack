import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RealTime Chat API",
      version: "1.0.0",
      description: "API documentation for the RealTime Chat application",
      contact: {
        name: "Chat Team",
        email: "support@chatapp.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://api.chatapp.com"
            : "http://localhost:3001",
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "clx1234567890" },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            username: { type: "string", example: "johnsmith" },
            displayName: { type: "string", example: "John Smith" },
            avatar: {
              type: "string",
              format: "uri",
              example: "https://example.com/avatar.jpg",
            },
            isOnline: { type: "boolean", example: true },
            lastSeen: { type: "string", format: "date-time" },
            twoFactorEnabled: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Message: {
          type: "object",
          properties: {
            id: { type: "string", example: "msg123456789" },
            content: { type: "string", example: "Hello, how are you?" },
            type: {
              type: "string",
              enum: ["TEXT", "IMAGE", "FILE", "SYSTEM"],
              example: "TEXT",
            },
            isEdited: { type: "boolean", example: false },
            isDeleted: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            senderId: { type: "string", example: "clx1234567890" },
            conversationId: { type: "string", example: "conv123456789" },
            sender: { $ref: "#/components/schemas/User" },
          },
        },
        Conversation: {
          type: "object",
          properties: {
            id: { type: "string", example: "conv123456789" },
            name: { type: "string", example: "Team Chat" },
            isGroup: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            members: {
              type: "array",
              items: { $ref: "#/components/schemas/User" },
            },
            lastMessage: { $ref: "#/components/schemas/Message" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Validation error" },
            message: {
              type: "string",
              example: "The provided data is invalid",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
            message: {
              type: "string",
              example: "Operation completed successfully",
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/server.ts"], // Path to the API files
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: Express) => {
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "RealTime Chat API Documentation",
    })
  );

  // JSON endpoint for the API spec
  app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });
};
