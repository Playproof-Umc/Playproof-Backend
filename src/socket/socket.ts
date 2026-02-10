import http from 'http';
import { Server } from 'socket.io';
import * as jose from 'jose';
import { authConfig } from '../common/config/auth';
import { SocketAuthData } from './types';
import { extractToken, parseUserId } from './utils/auth';
import { ChatRoomHandler } from './handler/chat.handler';
import { VoiceRoomHandler } from './handler/voice.handler';
import { PresenceHandler } from './handler/presence.handler';
import { PresenceService } from './services/presence.service';

export class SocketServer {
  private io: Server;
  private chatHandler: ChatRoomHandler;
  private voiceHandler: VoiceRoomHandler;
  private presenceHandler: PresenceHandler;
  private presenceService: PresenceService;

  constructor(httpServer: http.Server) {
    this.io = new Server(httpServer, {
      cors: {
        origin: true,
        credentials: true,
      },
    });

    this.chatHandler = new ChatRoomHandler(this.io);
    this.voiceHandler = new VoiceRoomHandler();
    this.presenceService = new PresenceService();
    this.presenceHandler = new PresenceHandler(this.io, this.presenceService);

    this.configureAuthMiddleware();
    this.configureHandlers();
  }

  private configureAuthMiddleware() {
    // 소켓 연결 시 토큰 검증
    this.io.use(async (socket, next) => {
      const token = extractToken(socket);
      if (!token) {
        return next(new Error('UNAUTHORIZED'));
      }

      try {
        const { payload } = await jose.jwtVerify(
          token,
          new TextEncoder().encode(authConfig.jwtSecret),
        );
        const userId = parseUserId(payload.userId);
        if (!userId) {
          return next(new Error('UNAUTHORIZED'));
        }
        (socket.data as SocketAuthData).userId = userId;
        return next();
      } catch {
        return next(new Error('UNAUTHORIZED'));
      }
    });
  }

  private configureHandlers() {
    this.io.on('connection', (socket) => {
      this.presenceHandler.handleConnect(socket);
      socket.on('joinRoom', (payload, ack) =>
        this.chatHandler.handleJoinRoom(socket, payload, ack),
      );
      socket.on('leaveRoom', (payload) =>
        this.chatHandler.handleLeaveRoom(socket, payload),
      );
      socket.on('sendMessage', (payload, ack) =>
        this.chatHandler.handleSendMessage(socket, payload, ack),
      );
      socket.on('voiceJoin', (payload, ack) =>
        this.voiceHandler.handleVoiceJoin(socket, payload, ack),
      );
      socket.on('voiceLeave', (payload, ack) =>
        this.voiceHandler.handleVoiceLeave(socket, payload, ack),
      );
      socket.on('getFriendOnlineStatus', (payload, ack) =>
        this.presenceHandler.handleGetFriendOnlineStatus(socket, payload, ack),
      );
      socket.on('disconnect', () => this.presenceHandler.handleDisconnect(socket));
    });
  }
}
