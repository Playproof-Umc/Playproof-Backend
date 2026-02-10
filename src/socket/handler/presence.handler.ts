import { Server, Socket } from 'socket.io';
import { container } from 'tsyringe';
import { isSuccess } from '../../common/types/result.type';
import { FriendService } from '../../modules/friend/services/friend.service';
import { FriendOnlineStatusPayload, SocketAuthData } from '../types';
import { getUserRoomKey } from '../utils/rooms';
import { PresenceService } from '../services/presence.service';

type Ack = (data: unknown) => void;

export class PresenceHandler {
  private friendService: FriendService;

  constructor(
    private io: Server,
    private presenceService: PresenceService,
  ) {
    this.friendService = container.resolve(FriendService);
  }

  async handleConnect(socket: Socket) {
    const authData = socket.data as SocketAuthData;
    const { userId } = authData;

    socket.join(getUserRoomKey(userId));
    const { isFirst } = await this.presenceService.register(userId, socket.id);
    if (!isFirst) {
      return;
    }

    await this.notifyFriends(userId, 'friendOnline');
  }

  async handleDisconnect(socket: Socket) {
    const authData = socket.data as SocketAuthData;
    const { userId } = authData;
    const { isLast } = await this.presenceService.unregister(userId, socket.id);
    if (!isLast) {
      return;
    }

    await this.notifyFriends(userId, 'friendOffline');
  }

  async handleGetFriendOnlineStatus(
    socket: Socket,
    payload: FriendOnlineStatusPayload,
    ack?: Ack,
  ) {
    const authData = socket.data as SocketAuthData;
    const { userId } = authData;
    const userIds = this.parseUserIds(payload);
    if (!userIds) {
      const response = {
        code: 'INVALID_PAYLOAD',
        message: 'userIds가 올바르지 않습니다.',
      };
      socket.emit('error', response);
      ack?.({ ok: false, error: response });
      return;
    }

    const friendListResult = await this.friendService.getFriendList(userId);
    if (!isSuccess(friendListResult)) {
      socket.emit('error', friendListResult.error);
      ack?.({ ok: false, error: friendListResult.error });
      return;
    }

    const friendIds = new Set(
      friendListResult.data.map((friend) => friend.userId),
    );
    const filteredIds = userIds.filter((id) => friendIds.has(id));
    const onlineIds = await this.presenceService.getOnlineUserIds(filteredIds);

    ack?.({ ok: true, data: { onlineIds } });
  }

  private async notifyFriends(
    userId: number,
    eventName: 'friendOnline' | 'friendOffline',
  ) {
    const friendListResult = await this.friendService.getFriendList(userId);
    if (!isSuccess(friendListResult)) {
      return;
    }

    friendListResult.data.forEach((friend) => {
      this.io.to(getUserRoomKey(friend.userId)).emit(eventName, { userId });
    });
  }

  private parseUserIds(payload: FriendOnlineStatusPayload): number[] | null {
    if (!Array.isArray(payload?.userIds)) {
      return null;
    }
    const userIds = payload.userIds.map((userId) => Number(userId));
    const invalid = userIds.some((userId) => !Number.isFinite(userId));
    if (invalid) {
      return null;
    }
    return userIds;
  }
}
