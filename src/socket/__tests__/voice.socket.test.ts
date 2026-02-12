import http from 'http';
import * as jose from 'jose';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { container } from 'tsyringe';
import { forbidden, ok } from '../../common/types/result.type';
import { FriendService } from '../../modules/friend/services/friend.service';
import { ChatService } from '../../modules/chat/service/chat.service';
import { ChatErrorCode } from '../../common/constants/error-code';

jest.mock('../../common/config/database');

const waitForConnect = (socket: ClientSocket) =>
  new Promise<void>((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', (err) => reject(err));
  });

const waitForEvent = <T>(socket: ClientSocket, event: string) =>
  new Promise<T>((resolve) => {
    socket.once(event, (payload: T) => resolve(payload));
  });

const createToken = async (userId: number) => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
  return new jose.SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
};

describe('socket voice', () => {
  let httpServer: http.Server;
  let port: number;
  let chatServiceMock: {
    joinRoom: jest.Mock;
    sendMessage: jest.Mock;
    getRoomAndMember: jest.Mock;
  };
  let SocketServerClass: any;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';

    container.registerInstance(
      FriendService,
      { getFriendList: jest.fn(async () => ok([])) } as any,
    );

    chatServiceMock = {
      joinRoom: jest.fn(async (roomId: number, userId: number) =>
        ok({ roomId, azitId: 1 }),
      ),
      sendMessage: jest.fn(
        async (
          roomId: number,
          userId: number,
          content: string,
          mediaUrls?: string[],
        ) =>
          ok({
            id: 1,
            chatRoomId: roomId,
            memberId: 10,
            userId,
            nickname: 'tester',
            content,
            mediaUrls,
            createdAt: new Date().toISOString(),
          }),
      ),
      getRoomAndMember: jest.fn(async (roomId: number, userId: number) =>
        ok({ roomId, memberId: userId }),
      ),
    };
    container.registerInstance(ChatService, chatServiceMock as any);

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

  it('broadcasts voiceUserJoined when user joins voice chat', async () => {
    const receiver = await connectUser(2);
    const joiner = await connectUser(1);

    await new Promise<any>((resolve) => {
      receiver.emit('joinRoom', { roomId: 1 }, resolve);
    });
    const voiceJoinedPromise = waitForEvent<{ roomId: number; userId: number }>(
      receiver,
      'voiceUserJoined',
    );

    const voiceJoinAck = await new Promise<any>((resolve) => {
      joiner.emit('voiceJoin', { roomId: 1 }, resolve);
    });

    expect(voiceJoinAck.ok).toBe(true);
    const payload = await voiceJoinedPromise;
    expect(payload).toEqual({ roomId: 1, userId: 1 });

    joiner.disconnect();
    receiver.disconnect();
  });

  it('broadcasts voiceUserLeft when user leaves voice chat', async () => {
    const receiver = await connectUser(2);
    const leaver = await connectUser(1);

    await new Promise<any>((resolve) => {
      receiver.emit('joinRoom', { roomId: 1 }, resolve);
    });
    await new Promise<any>((resolve) => {
      leaver.emit('voiceJoin', { roomId: 1 }, resolve);
    });

    const voiceLeftPromise = waitForEvent<{ roomId: number; userId: number }>(
      receiver,
      'voiceUserLeft',
    );

    const voiceLeaveAck = await new Promise<any>((resolve) => {
      leaver.emit('voiceLeave', { roomId: 1 }, resolve);
    });

    expect(voiceLeaveAck.ok).toBe(true);
    const payload = await voiceLeftPromise;
    expect(payload).toEqual({ roomId: 1, userId: 1 });

    leaver.disconnect();
    receiver.disconnect();
  });

  it('does not broadcast voiceUserJoined to sender', async () => {
    const joiner = await connectUser(1);

    await new Promise<any>((resolve) => {
      joiner.emit('joinRoom', { roomId: 1 }, resolve);
    });

    const voiceJoinedPromise = waitForEvent<{ roomId: number; userId: number }>(
      joiner,
      'voiceUserJoined',
    );

    await new Promise<any>((resolve) => {
      joiner.emit('voiceJoin', { roomId: 1 }, resolve);
    });

    await expect(
      Promise.race([
        voiceJoinedPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 200),
        ),
      ]),
    ).rejects.toThrow('timeout');

    joiner.disconnect();
  });

  it('returns error for invalid roomId on voiceJoin', async () => {
    const socket = await connectUser(1);
    const response = await new Promise<any>((resolve) => {
      socket.emit('voiceJoin', { roomId: 'bad' }, resolve);
    });

    expect(response.ok).toBe(false);
    expect(response.error.code).toBe('INVALID_ROOM');

    socket.disconnect();
  });

  it('returns error for invalid roomId on voiceLeave', async () => {
    const socket = await connectUser(1);
    const response = await new Promise<any>((resolve) => {
      socket.emit('voiceLeave', { roomId: 'bad' }, resolve);
    });

    expect(response.ok).toBe(false);
    expect(response.error.code).toBe('INVALID_ROOM');

    socket.disconnect();
  });

  it('propagates getRoomAndMember permission errors on voiceJoin', async () => {
    chatServiceMock.getRoomAndMember.mockResolvedValueOnce(
      forbidden({
        message: '권한 없음',
        errorCode: ChatErrorCode.AZIT_MEMBER_ONLY,
      }),
    );

    const socket = await connectUser(1);
    const response = await new Promise<any>((resolve) => {
      socket.emit('voiceJoin', { roomId: 1 }, resolve);
    });

    expect(response.ok).toBe(false);
    expect(response.error.code).toBe(ChatErrorCode.AZIT_MEMBER_ONLY);

    socket.disconnect();
  });
});
