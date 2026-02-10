import http from 'http';
import * as jose from 'jose';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { container } from 'tsyringe';
import { ok } from '../../common/types/result.type';
import { FriendService } from '../../modules/friend/services/friend.service';

jest.mock('../../common/config/database');

type FriendItem = {
  userId: number;
  nickname: string | null;
  avatarUrl: string | null;
  statusMessage: string | null;
  trustScore: number | null;
  friendAt: Date | null;
};

const waitForEvent = <T>(socket: ClientSocket, event: string) =>
  new Promise<T>((resolve) => {
    socket.once(event, (payload: T) => resolve(payload));
  });

const waitForNoEvent = (
  socket: ClientSocket,
  event: string,
  timeoutMs: number = 150,
) =>
  new Promise<void>((resolve, reject) => {
    const handler = () => {
      clearTimeout(timer);
      reject(new Error(`Unexpected ${event}`));
    };
    const timer = setTimeout(() => {
      socket.off(event, handler);
      resolve();
    }, timeoutMs);
    socket.once(event, handler);
  });

const waitForConnect = (socket: ClientSocket) =>
  new Promise<void>((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', (err) => reject(err));
  });

const createToken = async (userId: number) => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
  return new jose.SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
};

describe('socket presence', () => {
  let httpServer: http.Server;
  let port: number;
  let friendServiceMock: { getFriendList: jest.Mock };
  let SocketServerClass: any;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';

    friendServiceMock = {
      getFriendList: jest.fn(async (userId: number) => {
        if (userId === 1) {
          const friendList: FriendItem[] = [
            {
              userId: 2,
              nickname: null,
              avatarUrl: null,
              statusMessage: null,
              trustScore: null,
              friendAt: null,
            },
          ];
          return ok(friendList);
        }
        if (userId === 2) {
          const friendList: FriendItem[] = [
            {
              userId: 1,
              nickname: null,
              avatarUrl: null,
              statusMessage: null,
              trustScore: null,
              friendAt: null,
            },
          ];
          return ok(friendList);
        }
        return ok([]);
      }),
    };

    container.registerInstance(FriendService, friendServiceMock as any);

    SocketServerClass = require('../socket').SocketServer;
    httpServer = http.createServer();
    new SocketServerClass(httpServer);

    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    port = (httpServer.address() as { port: number }).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  const connectUser = async (userId: number) => {
    const token = await createToken(userId);
    const socket = Client(`http://localhost:${port}`, {
      auth: { token },
      transports: ['websocket'],
    });
    await waitForConnect(socket);
    return socket;
  };

  it('notifies friends when user goes online and offline', async () => {
    const friendSocket = await connectUser(2);
    const onlinePromise = waitForEvent<{ userId: number }>(
      friendSocket,
      'friendOnline',
    );

    const userSocket = await connectUser(1);
    const onlinePayload = await onlinePromise;
    expect(onlinePayload.userId).toBe(1);

    const offlinePromise = waitForEvent<{ userId: number }>(
      friendSocket,
      'friendOffline',
    );
    userSocket.disconnect();

    const offlinePayload = await offlinePromise;
    expect(offlinePayload.userId).toBe(1);

    friendSocket.disconnect();
  });

  it('rejects connection without token', async () => {
    const socket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
    });

    const error = await new Promise<Error>((resolve) => {
      socket.once('connect_error', (err) => resolve(err));
    });

    expect(error.message).toBe('UNAUTHORIZED');
    socket.disconnect();
  });

  it('does not emit offline until last socket disconnects', async () => {
    const friendSocket = await connectUser(2);
    const onlinePromise = waitForEvent<{ userId: number }>(
      friendSocket,
      'friendOnline',
    );

    const userSocket1 = await connectUser(1);
    const onlinePayload = await onlinePromise;
    expect(onlinePayload.userId).toBe(1);

    const userSocket2 = await connectUser(1);
    await waitForNoEvent(friendSocket, 'friendOnline');

    userSocket1.disconnect();
    await waitForNoEvent(friendSocket, 'friendOffline');

    const offlinePromise = waitForEvent<{ userId: number }>(
      friendSocket,
      'friendOffline',
    );
    userSocket2.disconnect();

    const offlinePayload = await offlinePromise;
    expect(offlinePayload.userId).toBe(1);

    friendSocket.disconnect();
  });

  it('returns online status only for friends', async () => {
    const friendSocket = await connectUser(2);
    const userSocket = await connectUser(1);

    const response = await new Promise<any>((resolve) => {
      friendSocket.emit(
        'getFriendOnlineStatus',
        { userIds: [1, 2, 999] },
        resolve,
      );
    });

    expect(response.ok).toBe(true);
    expect(response.data.onlineIds).toEqual([1]);

    userSocket.disconnect();
    friendSocket.disconnect();
  });

  it('rejects invalid online status payload', async () => {
    const friendSocket = await connectUser(2);

    const response = await new Promise<any>((resolve) => {
      friendSocket.emit(
        'getFriendOnlineStatus',
        { userIds: ['bad'] },
        resolve,
      );
    });

    expect(response.ok).toBe(false);
    expect(response.error.code).toBe('INVALID_PAYLOAD');

    friendSocket.disconnect();
  });
});
