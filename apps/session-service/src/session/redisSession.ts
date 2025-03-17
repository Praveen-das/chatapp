import client from "../redis/client";

class SessionService {
  private redisClient;

  constructor() {
    this.redisClient = client;
  }

  saveSession(session: ISession) {
    if (!session) return;

    return this.redisClient
      .multi()
      .hset(`session:${session.sessionId}`, session)
      .sadd(`user_sessions:${session.userId}`, session.sessionId)
      .exec();
  }

  updateSession(session: ISession) {
    if (!session) throw "no sessionId provided";

    return this.redisClient.hset(`session:${session.sessionId}`, session);
  }

  async findAllSessions() {
    try {
      const keys = await this.redisClient.keys("session:*");
      const sessions = await Promise.all(
        keys.map(async (key) => {
          const value = await this.redisClient.hgetall(key);
          if (value) return value;
          else return null;
        })
      );
      return sessions;
    } catch (error) {
      console.error("Error retrieving all sessions:", error);
      return [];
    }
  }

  async findSession(sessionId: string) {
    const response = await this.redisClient.hgetall(`session:${sessionId}`);
    return !!Object.keys(response).length ? response : null;
  }

  async findUserSessions(userId: string) {
    try {
      const sessionIds = await this.redisClient.smembers(
        `user_sessions:${userId}`
      );

      const sessions = await Promise.all(
        sessionIds.map(async (id) => {
          const session = await this.findSession(id);
          if (session) session.data = JSON.parse(session.data);
          return session;
        })
      );

      return sessions;
    } catch (error) {
      console.error("Error retrieving user sessions:", error);
      return [];
    }
  }

  async deleteSession(sessionId: string) {
    const session = await this.findSession(sessionId);
    if (session && session.userId) {
      await this.redisClient.srem(`user_sessions:${session.userId}`, sessionId);
    }
    return this.redisClient.del(`session:${sessionId}`);
  }

  async clearUserSessions(sessionIds: string[],userId:string) {
    await Promise.all(
      sessionIds.map(async (sessionId) =>
        Promise.all([
          this.redisClient.del(`session:${sessionId}`),
          this.redisClient.srem(`user_sessions:${userId}`,sessionId)
        ])
      )
    );

    return "ok";
  }
}

export default SessionService;
