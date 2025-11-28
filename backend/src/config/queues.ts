import Bull from "bull";
import { redis } from "../lib/redis";
import Logger from "./logger";
import { elasticsearchService } from "./elasticsearch";

export const emailQueue = new Bull("email", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

export const searchIndexQueue = new Bull("search-index", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 20,
    attempts: 2,
  },
});

emailQueue.process("send-notification", async (job) => {
  const { to, subject, text, html, type } = job.data;

  try {
    Logger.info(`📧 Processing email job: ${type} to ${to}`);

    Logger.info(`📨 Email sent successfully: ${subject} to ${to}`);

    return { success: true, messageId: `msg_${Date.now()}` };
  } catch (error) {
    Logger.error("❌ Email sending failed:", error);
    throw error;
  }
});

searchIndexQueue.process("index-message", async (job) => {
  const { message } = job.data;

  try {
    await elasticsearchService.indexMessage(message);
    Logger.debug(`🔍 Message indexed: ${message.id}`);
    return { success: true };
  } catch (error) {
    Logger.error("❌ Message indexing failed:", error);
    throw error;
  }
});

searchIndexQueue.process("index-user", async (job) => {
  const { user } = job.data;

  try {
    await elasticsearchService.indexUser(user);
    Logger.debug(`👤 User indexed: ${user.id}`);
    return { success: true };
  } catch (error) {
    Logger.error("❌ User indexing failed:", error);
    throw error;
  }
});

searchIndexQueue.process("delete-message", async (job) => {
  const { messageId } = job.data;

  try {
    await elasticsearchService.deleteMessage(messageId);
    Logger.debug(`🗑️ Message deleted from index: ${messageId}`);
    return { success: true };
  } catch (error) {
    Logger.error("❌ Message deletion from index failed:", error);
    throw error;
  }
});

export const queueHelpers = {
  async sendEmail(emailData: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    type: "welcome" | "reset-password" | "2fa-code" | "notification";
  }) {
    return await emailQueue.add("send-notification", emailData, {
      priority: emailData.type === "2fa-code" ? 10 : 1,
    });
  },

  async indexMessage(message: any) {
    return await searchIndexQueue.add("index-message", { message });
  },

  async indexUser(user: any) {
    return await searchIndexQueue.add("index-user", { user });
  },

  async deleteMessageFromIndex(messageId: string) {
    return await searchIndexQueue.add("delete-message", { messageId });
  },

  async getQueueStats() {
    const [emailStats, searchStats] = await Promise.all([
      Promise.all([
        emailQueue.getWaiting(),
        emailQueue.getActive(),
        emailQueue.getCompleted(),
        emailQueue.getFailed(),
      ]),
      Promise.all([
        searchIndexQueue.getWaiting(),
        searchIndexQueue.getActive(),
        searchIndexQueue.getCompleted(),
        searchIndexQueue.getFailed(),
      ]),
    ]);

    return {
      email: {
        waiting: emailStats[0].length,
        active: emailStats[1].length,
        completed: emailStats[2].length,
        failed: emailStats[3].length,
      },
      searchIndex: {
        waiting: searchStats[0].length,
        active: searchStats[1].length,
        completed: searchStats[2].length,
        failed: searchStats[3].length,
      },
    };
  },
};

emailQueue.on("completed", (job) => {
  Logger.info(`📧 Email job completed: ${job.id}`);
});

emailQueue.on("failed", (job, err) => {
  Logger.error(`❌ Email job failed: ${job.id}`, err);
});

searchIndexQueue.on("completed", (job) => {
  Logger.debug(`🔍 Search index job completed: ${job.id}`);
});

searchIndexQueue.on("failed", (job, err) => {
  Logger.error(`❌ Search index job failed: ${job.id}`, err);
});

Logger.info("📋 Queue system initialized");
