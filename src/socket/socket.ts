import http from "http";
import { Server } from "socket.io";
import * as jose from "jose";
import { authConfig } from "../common/config/auth";
import { SocketAuthData } from "./types";
import { extractToken, parseUserId } from "./utils/auth";
import { VoiceRoomStore } from "./utils/voice-room.store";
import { ChatRoomHandler } from "./handler/chat.handler";
import { VoiceRoomHandler } from "./handler/voice.handler";

export class SocketServer {
  private io: Server;
  private chatHandler: ChatRoomHandler;
  private voiceHandler: VoiceRoomHandler;

  constructor(httpServer: http.Server) {
    this.io = new Server(httpServer, {
      cors: {
        origin: true,
        credentials: true,
      },
    });

    const voiceRoomStore = new VoiceRoomStore();
    this.chatHandler = new ChatRoomHandler(this.io);
    this.voiceHandler = new VoiceRoomHandler(this.io, voiceRoomStore);

    this.configureAuthMiddleware();
    this.configureHandlers();
  }

  private configureAuthMiddleware() {
    // 소켓 연결 시 토큰 검증
    this.io.use(async (socket, next) => {
      const token = extractToken(socket);
      if (!token) {
        return next(new Error("UNAUTHORIZED"));
      }

      try {
        const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(authConfig.jwtSecret));
        const userId = parseUserId(payload.userId);
        if (!userId) {
          return next(new Error("UNAUTHORIZED"));
        }
        (socket.data as SocketAuthData).userId = userId;
        return next();
      } catch {
        return next(new Error("UNAUTHORIZED"));
      }
    });
  }

  private configureHandlers() {
    this.io.on("connection", (socket) => {
      const authData = socket.data as SocketAuthData;
      if (!authData.voiceRooms) authData.voiceRooms = new Set<number>();

      const eventHandlers: Array<[string, (...args: any[]) => void]> = [
        ["joinRoom", (payload, ack) => this.chatHandler.handleJoinRoom(socket, payload, ack)],
        ["leaveRoom", (payload) => this.chatHandler.handleLeaveRoom(socket, payload)],
        ["sendMessage", (payload, ack) => this.chatHandler.handleSendMessage(socket, payload, ack)],
        ["voiceJoin", (payload, ack) => this.voiceHandler.handleVoiceJoin(socket, payload, ack)],
        ["voiceLeave", (payload, ack) => this.voiceHandler.handleVoiceLeave(socket, payload, ack)],
      ];

      for (const [event, handler] of eventHandlers) {
        socket.on(event, handler);
      }

      socket.on("disconnect", () => this.voiceHandler.handleDisconnect(socket));
    });
  }

}
