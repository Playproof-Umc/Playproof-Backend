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

describe('socket chat', () => {
  let httpServer: http.Server;
  let port: number;
  let chatServiceMock: {
    joinRoom: jest.Mock;
    sendMessage: jest.Mock;
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
        async (roomId: number, userId: number, content: string) =>
          ok({
            id: 1,
            chatRoomId: roomId,
            memberId: 10,
            userId,
            nickname: 'tester',
            content,
            createdAt: new Date().toISOString(),
          }),
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

  it('joins room and broadcasts newMessage', async () => {
    const receiver = await connectUser(2);
    const sender = await connectUser(1);

    const joinAck1 = await new Promise<any>((resolve) => {
      sender.emit('joinRoom', { roomId: 1 }, resolve);
    });
    const joinAck2 = await new Promise<any>((resolve) => {
      receiver.emit('joinRoom', { roomId: 1 }, resolve);
    });

    expect(joinAck1.ok).toBe(true);
    expect(joinAck2.ok).toBe(true);

    const messagePromise = waitForEvent<any>(receiver, 'newMessage');
    const sendAck = await new Promise<any>((resolve) => {
      sender.emit('sendMessage', { roomId: 1, content: 'hello' }, resolve);
    });

    expect(sendAck.ok).toBe(true);
    const message = await messagePromise;
    expect(message.content).toBe('hello');

    sender.disconnect();
    receiver.disconnect();
  });

  it('rejects connection with invalid token', async () => {
    const badToken = await new jose.SignJWT({ userId: 1 })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(new TextEncoder().encode('wrong-secret'));

    const socket = Client(`http://localhost:${port}`, {
      auth: { token: badToken },
      transports: ['websocket'],
    });

    const error = await new Promise<Error>((resolve) => {
      socket.once('connect_error', (err) => resolve(err));
    });

    expect(error.message).toBe('UNAUTHORIZED');
    socket.disconnect();
  });

  it('returns error for invalid roomId', async () => {
    const socket = await connectUser(1);
    const response = await new Promise<any>((resolve) => {
      socket.emit('joinRoom', { roomId: 'bad' }, resolve);
    });

    expect(response.ok).toBe(false);
    expect(response.error.code).toBe('INVALID_ROOM');

    socket.disconnect();
  });

  it('returns error for invalid message content', async () => {
    const socket = await connectUser(1);
    const response = await new Promise<any>((resolve) => {
      socket.emit('sendMessage', { roomId: 1, content: '   ' }, resolve);
    });

    expect(response.ok).toBe(false);
    expect(response.error.code).toBe(ChatErrorCode.MESSAGE_INVALID);

    socket.disconnect();
  });

  it('propagates joinRoom permission errors', async () => {
    chatServiceMock.joinRoom.mockResolvedValueOnce(
      forbidden({
        message: '권한 없음',
        errorCode: ChatErrorCode.AZIT_MEMBER_ONLY,
      }),
    );

    const socket = await connectUser(1);
    const response = await new Promise<any>((resolve) => {
      socket.emit('joinRoom', { roomId: 1 }, resolve);
    });

    expect(response.ok).toBe(false);
    expect(response.error.code).toBe(ChatErrorCode.AZIT_MEMBER_ONLY);

    socket.disconnect();
  });

  it('propagates sendMessage permission errors', async () => {
    chatServiceMock.sendMessage.mockResolvedValueOnce(
      forbidden({
        message: '권한 없음',
        errorCode: ChatErrorCode.AZIT_MEMBER_ONLY,
      }),
    );

    const socket = await connectUser(1);
    const response = await new Promise<any>((resolve) => {
      socket.emit('sendMessage', { roomId: 1, content: 'hello' }, resolve);
    });

    expect(response.ok).toBe(false);
    expect(response.error.code).toBe(ChatErrorCode.AZIT_MEMBER_ONLY);

    socket.disconnect();
  });
});
