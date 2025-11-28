import { Client } from "@elastic/elasticsearch";
import Logger from "./logger";

class ElasticsearchService {
  private client: Client | null = null;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private async connect() {
    try {
      this.client = new Client({
        node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
        requestTimeout: 30000,
        maxRetries: 3,
      });

      await this.client.ping();
      this.isConnected = true;
      Logger.info("✅ Elasticsearch connected successfully");

      await this.initializeIndices();
    } catch (error) {
      Logger.warn(
        "⚠️ Elasticsearch not available, search features will be limited"
      );
      this.isConnected = false;
    }
  }

  private async initializeIndices() {
    if (!this.client || !this.isConnected) return;

    const indices = [
      {
        index: "messages",
        mapping: {
          properties: {
            id: { type: "keyword" },
            content: { type: "text", analyzer: "standard" },
            type: { type: "keyword" },
            senderId: { type: "keyword" },
            conversationId: { type: "keyword" },
            createdAt: { type: "date" },
            isDeleted: { type: "boolean" },
          },
        },
      },
      {
        index: "users",
        mapping: {
          properties: {
            id: { type: "keyword" },
            username: { type: "text", analyzer: "standard" },
            displayName: { type: "text", analyzer: "standard" },
            email: { type: "keyword" },
            isOnline: { type: "boolean" },
            createdAt: { type: "date" },
          },
        },
      },
    ];

    for (const indexConfig of indices) {
      try {
        const exists = await this.client.indices.exists({
          index: indexConfig.index,
        });
        if (!exists) {
          await this.client.indices.create({
            index: indexConfig.index,
            mappings: indexConfig.mapping as any,
          });
          Logger.info(`📋 Created Elasticsearch index: ${indexConfig.index}`);
        }
      } catch (error) {
        Logger.error(`❌ Error creating index ${indexConfig.index}:`, error);
      }
    }
  }

  async indexMessage(message: any) {
    if (!this.client || !this.isConnected) return;

    try {
      await this.client.index({
        index: "messages",
        id: message.id,
        document: {
          id: message.id,
          content: message.content,
          type: message.type,
          senderId: message.senderId,
          conversationId: message.conversationId,
          createdAt: message.createdAt,
          isDeleted: message.isDeleted || false,
        },
      });
    } catch (error) {
      Logger.error("❌ Error indexing message:", error);
    }
  }

  async indexUser(user: any) {
    if (!this.client || !this.isConnected) return;

    try {
      await this.client.index({
        index: "users",
        id: user.id,
        document: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          isOnline: user.isOnline,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      Logger.error("❌ Error indexing user:", error);
    }
  }

  async searchMessages(query: string, conversationId?: string, limit = 20) {
    if (!this.client || !this.isConnected) {
      return { hits: [], total: 0 };
    }

    try {
      const searchBody: any = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: query,
                  fields: ["content"],
                  fuzziness: "AUTO",
                },
              },
              {
                term: { isDeleted: false },
              },
            ],
          },
        },
        sort: [{ createdAt: { order: "desc" } }],
        size: limit,
      };

      if (conversationId) {
        searchBody.query.bool.must.push({
          term: { conversationId: conversationId },
        });
      }
      const response = await this.client.search({
        index: "messages",
        ...searchBody,
      });
      return {
        hits: response.hits.hits.map((hit: any) => hit._source),
        total:
          typeof response.hits.total === "number"
            ? response.hits.total
            : response.hits.total?.value || 0,
      };
    } catch (error) {
      Logger.error("❌ Error searching messages:", error);
      return { hits: [], total: 0 };
    }
  }

  async searchUsers(query: string, limit = 20) {
    if (!this.client || !this.isConnected) {
      return { hits: [], total: 0 };
    }

    try {
      const response = await this.client.search({
        index: "users",
        query: {
          multi_match: {
            query: query,
            fields: ["username", "displayName"],
            fuzziness: "AUTO",
          },
        },
        sort: [{ isOnline: { order: "desc" } }],
        size: limit,
      });
      return {
        hits: response.hits.hits.map((hit: any) => hit._source),
        total:
          typeof response.hits.total === "number"
            ? response.hits.total
            : response.hits.total?.value || 0,
      };
    } catch (error) {
      Logger.error("❌ Error searching users:", error);
      return { hits: [], total: 0 };
    }
  }

  async deleteMessage(messageId: string) {
    if (!this.client || !this.isConnected) return;

    try {
      await this.client.update({
        index: "messages",
        id: messageId,
        doc: {
          isDeleted: true,
        },
      });
    } catch (error) {
      Logger.error("❌ Error deleting message from search index:", error);
    }
  }

  isAvailable() {
    return this.isConnected;
  }
}

export const elasticsearchService = new ElasticsearchService();
