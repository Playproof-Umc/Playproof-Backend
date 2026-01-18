import http from "http";
import { Server, Socket } from "socket.io";
import * as jose from "jose";
import { container } from "tsyringe";
import { authConfig } from "../common/config/auth";
import { ChatService } from "../modules/chat/service/chat.service";
import { isSuccess } from "../common/types/result.type";

type SocketAuthData = {
  userId: number;
};

type JoinRoomPayload = {
  roomId: number;
};

type SendMessagePayload = {
  roomId: number;
  content: string;
};

const CHAT_ROOM_PREFIX = "chatRoom:";

const getRoomKey = (roomId: number) => `${CHAT_ROOM_PREFIX}${roomId}`;

const extractToken = (socket: Socket): string | null => {
  const authHeader = socket.handshake.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const authToken = socket.handshake.auth?.token;
  return typeof authToken === "string" ? authToken : null;
};

const parseUserId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const initSocketServer = (httpServer: http.Server) => {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
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

  io.on("connection", (socket) => {
    const chatService = container.resolve(ChatService);
    const { userId } = socket.data as SocketAuthData;

    socket.on("joinRoom", async (payload: JoinRoomPayload, ack?: (data: unknown) => void) => {
      const roomId = Number(payload?.roomId);
      if (!Number.isFinite(roomId)) {
        const response = { code: "INVALID_ROOM", message: "roomId가 올바르지 않습니다." };
        socket.emit("error", response);
        ack?.({ ok: false, error: response });
        return;
      }

      const result = await chatService.joinRoom(roomId, userId);
      if (!isSuccess(result)) {
        socket.emit("error", result.error);
        ack?.({ ok: false, error: result.error });
        return;
      }

      socket.join(getRoomKey(roomId));
      ack?.({ ok: true, data: result.data });
    });

    socket.on("leaveRoom", (payload: JoinRoomPayload) => {
      const roomId = Number(payload?.roomId);
      if (!Number.isFinite(roomId)) {
        socket.emit("error", { code: "INVALID_ROOM", message: "roomId가 올바르지 않습니다." });
        return;
      }
      socket.leave(getRoomKey(roomId));
    });

    socket.on("sendMessage", async (payload: SendMessagePayload, ack?: (data: unknown) => void) => {
      const roomId = Number(payload?.roomId);
      if (!Number.isFinite(roomId) || !payload?.content?.trim()) {
        const response = { code: "INVALID_MESSAGE", message: "메시지 입력이 올바르지 않습니다." };
        socket.emit("error", response);
        ack?.({ ok: false, error: response });
        return;
      }

      const result = await chatService.sendMessage(roomId, userId, payload.content.trim());
      if (!isSuccess(result)) {
        socket.emit("error", result.error);
        ack?.({ ok: false, error: result.error });
        return;
      }

      io.to(getRoomKey(roomId)).emit("newMessage", result.data);
      ack?.({ ok: true, data: result.data });
    });
  });

  return io;
};
