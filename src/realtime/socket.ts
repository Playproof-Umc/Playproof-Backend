import http from "http";
import { Server, Socket } from "socket.io";
import * as jose from "jose";
import { container } from "tsyringe";
import { authConfig } from "../common/config/auth";
import { ChatService } from "../modules/chat/service/chat.service";
import { isSuccess } from "../common/types/result.type";

type SocketAuthData = {
  userId: number;
  // 현재 참여중인 모임 ID 목록
  voiceRooms?: Set<number>;
};

type JoinRoomPayload = {
  roomId: number;
};

type SendMessagePayload = {
  roomId: number;
  content: string;
};

const CHAT_ROOM_PREFIX = "chatRoom:";
const VOICE_ROOM_PREFIX = "voiceRoom:";

// 채팅 방 키 생성
const getRoomKey = (roomId: number) => `${CHAT_ROOM_PREFIX}${roomId}`;
// 음성 방 키 생성
const getVoiceRoomKey = (roomId: number) => `${VOICE_ROOM_PREFIX}${roomId}`;

// 토큰 추출
const extractToken = (socket: Socket): string | null => {
  const authHeader = socket.handshake.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const authToken = socket.handshake.auth?.token;
  return typeof authToken === "string" ? authToken : null;
};

// 사용자 ID 파싱
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
  const voiceMembers = new Map<number, Map<number, number>>();

  const addVoiceMember = (roomId: number, userId: number) => {
    const members = voiceMembers.get(roomId) ?? new Map<number, number>();
    const current = members.get(userId) ?? 0;
    members.set(userId, current + 1);
    voiceMembers.set(roomId, members);
  };

  const removeVoiceMember = (roomId: number, userId: number) => {
    const members = voiceMembers.get(roomId);
    if (!members) return;
    const current = members.get(userId) ?? 0;
    if (current <= 1) {
      members.delete(userId);
    } else {
      members.set(userId, current - 1);
    }
    if (members.size === 0) {
      voiceMembers.delete(roomId);
    }
  };

  const listVoiceParticipants = (roomId: number) => {
    const members = voiceMembers.get(roomId);
    return members ? Array.from(members.keys()) : [];
  };

  // 소켓 연결 시 토큰 검증
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
    const authData = socket.data as SocketAuthData;
    const { userId } = authData;
    if (!authData.voiceRooms) authData.voiceRooms = new Set<number>();

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

    // 음성 방 참여
    socket.on("voiceJoin", async (payload: JoinRoomPayload, ack?: (data: unknown) => void) => {
      const roomId = Number(payload?.roomId);
      if (!Number.isFinite(roomId)) {
        const response = { code: "INVALID_ROOM", message: "roomId가 올바르지 않습니다." };
        socket.emit("error", response);
        ack?.({ ok: false, error: response });
        return;
      }

      // 모임 참여 권한 확인
      const access = await chatService.getRoomAndMember(roomId, userId);
      if (!isSuccess(access)) {
        socket.emit("error", access.error);
        ack?.({ ok: false, error: access.error });
        return;
      }

      // 음성 방 참여
      socket.join(getVoiceRoomKey(roomId));
      addVoiceMember(roomId, userId);
      authData.voiceRooms?.add(roomId);

      // 음성 방 참여자 목록 업데이트
      const participants = listVoiceParticipants(roomId);
      io.to(getVoiceRoomKey(roomId)).emit("voiceParticipants", { roomId, participants });
      io.to(getVoiceRoomKey(roomId)).emit("voiceJoined", { roomId, userId });
      ack?.({ ok: true, data: { roomId, participants } });
    });

    // 음성 방 퇴장
    socket.on("voiceLeave", (payload: JoinRoomPayload, ack?: (data: unknown) => void) => {
      const roomId = Number(payload?.roomId);
      if (!Number.isFinite(roomId)) {
        const response = { code: "INVALID_ROOM", message: "roomId가 올바르지 않습니다." };
        socket.emit("error", response);
        ack?.({ ok: false, error: response });
        return;
      }

      // 음성 방 퇴장
      socket.leave(getVoiceRoomKey(roomId));
      removeVoiceMember(roomId, userId);
      authData.voiceRooms?.delete(roomId);

      // 음성 방 참여자 목록 업데이트
      const participants = listVoiceParticipants(roomId);
      io.to(getVoiceRoomKey(roomId)).emit("voiceParticipants", { roomId, participants });
      io.to(getVoiceRoomKey(roomId)).emit("voiceLeft", { roomId, userId });
      ack?.({ ok: true, data: { roomId, participants } });
    });

    // 메시지 전송
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

      // 메시지 전송 알림
      io.to(getRoomKey(roomId)).emit("newMessage", result.data);
      ack?.({ ok: true, data: result.data });
    });

    // 소켓 연결 끊김
    socket.on("disconnect", () => {
      // 음성 방 퇴장
      const rooms = authData.voiceRooms;
      if (!rooms || rooms.size === 0) return;
      for (const roomId of rooms) {
        removeVoiceMember(roomId, userId);
        const participants = listVoiceParticipants(roomId);
        io.to(getVoiceRoomKey(roomId)).emit("voiceParticipants", { roomId, participants });
        io.to(getVoiceRoomKey(roomId)).emit("voiceLeft", { roomId, userId });
      }
      rooms.clear();
    });
  });

  return io;
};
