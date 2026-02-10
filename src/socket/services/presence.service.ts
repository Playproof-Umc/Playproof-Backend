import { redisClient } from '../../common/config/database';
import { REDIS_PREFIX } from '../../common/constants/redis.const';

export class PresenceService {
  async register(userId: number, socketId: string): Promise<{ isFirst: boolean }> {
    const userKey = this.getUserSocketsKey(userId);
    await redisClient.sAdd(userKey, socketId);
    const count = await redisClient.sCard(userKey);
    const isFirst = count === 1;
    if (isFirst) {
      await redisClient.sAdd(REDIS_PREFIX.PRESENCE_ONLINE_SET, String(userId));
    }
    return { isFirst };
  }

  async unregister(
    userId: number,
    socketId: string,
  ): Promise<{ isLast: boolean }> {
    const userKey = this.getUserSocketsKey(userId);
    await redisClient.sRem(userKey, socketId);
    const count = await redisClient.sCard(userKey);
    const isLast = count === 0;
    if (isLast) {
      await redisClient.del(userKey);
      await redisClient.sRem(REDIS_PREFIX.PRESENCE_ONLINE_SET, String(userId));
    }
    return { isLast };
  }

  async isOnline(userId: number): Promise<boolean> {
    const result = await redisClient.sIsMember(
      REDIS_PREFIX.PRESENCE_ONLINE_SET,
      String(userId),
    );
    return result === 1;
  }

  async getOnlineUserIds(userIds: number[]): Promise<number[]> {
    const checks = await Promise.all(
      userIds.map((userId) =>
        this.isOnline(userId).then((online) => ({ userId, online })),
      ),
    );
    return checks.filter((item) => item.online).map((item) => item.userId);
  }

  private getUserSocketsKey(userId: number): string {
    return `${REDIS_PREFIX.PRESENCE_USER_SOCKETS}${userId}`;
  }
}
