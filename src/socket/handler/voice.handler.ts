import { Server, Socket } from "socket.io";
import { container } from "tsyringe";
import { ChatService } from "../../modules/chat/service/chat.service";
import { isSuccess } from "../../common/types/result.type";
import { JoinRoomPayload, SocketAuthData } from "../types";
import { getVoiceRoomKey } from "../utils/rooms";
import { VoiceRoomStore } from "../utils/voice-room.store";

type Ack = (data: unknown) => void;

export class VoiceRoomHandler {
  private chatService: ChatService;

  constructor(
    private io: Server,
    private voiceRoomStore: VoiceRoomStore,
  ) {
    this.chatService = container.resolve(ChatService);
  }

  async handleVoiceJoin(socket: Socket, payload: JoinRoomPayload, ack?: Ack) {
    const authData = socket.data as SocketAuthData;
    const { userId } = authData;
    const roomId = this.parseRoomId(payload);
    if (!roomId) {
      const response = { code: "INVALID_ROOM", message: "roomId가 올바르지 않습니다." };
      socket.emit("error", response);
      ack?.({ ok: false, error: response });
      return;
    }

    // 모임 참여 권한 확인
    const access = await this.chatService.getRoomAndMember(roomId, userId);
    if (!isSuccess(access)) {
      socket.emit("error", access.error);
      ack?.({ ok: false, error: access.error });
      return;
    }

    // 음성 방 참여
    socket.join(getVoiceRoomKey(roomId));
    this.voiceRoomStore.addMember(roomId, userId);
    authData.voiceRooms?.add(roomId);

    // 음성 방 참여자 목록 업데이트
    const participants = this.voiceRoomStore.listParticipants(roomId);
    this.io.to(getVoiceRoomKey(roomId)).emit("voiceParticipants", { roomId, participants });
    this.io.to(getVoiceRoomKey(roomId)).emit("voiceJoined", { roomId, userId });
    ack?.({ ok: true, data: { roomId, participants } });
  }

  handleVoiceLeave(socket: Socket, payload: JoinRoomPayload, ack?: Ack) {
    const authData = socket.data as SocketAuthData;
    const { userId } = authData;
    const roomId = this.parseRoomId(payload);
    if (!roomId) {
      const response = { code: "INVALID_ROOM", message: "roomId가 올바르지 않습니다." };
      socket.emit("error", response);
      ack?.({ ok: false, error: response });
      return;
    }

    // 음성 방 퇴장
    socket.leave(getVoiceRoomKey(roomId));
    this.voiceRoomStore.removeMember(roomId, userId);
    authData.voiceRooms?.delete(roomId);

    // 음성 방 참여자 목록 업데이트
    const participants = this.voiceRoomStore.listParticipants(roomId);
    this.io.to(getVoiceRoomKey(roomId)).emit("voiceParticipants", { roomId, participants });
    this.io.to(getVoiceRoomKey(roomId)).emit("voiceLeft", { roomId, userId });
    ack?.({ ok: true, data: { roomId, participants } });
  }

  handleDisconnect(socket: Socket) {
    const authData = socket.data as SocketAuthData;
    const { userId } = authData;
    const rooms = authData.voiceRooms;
    if (!rooms || rooms.size === 0) return;
    for (const roomId of rooms) {
      this.voiceRoomStore.removeMember(roomId, userId);
      const participants = this.voiceRoomStore.listParticipants(roomId);
      this.io.to(getVoiceRoomKey(roomId)).emit("voiceParticipants", { roomId, participants });
      this.io.to(getVoiceRoomKey(roomId)).emit("voiceLeft", { roomId, userId });
    }
    rooms.clear();
  }

  private parseRoomId(payload: JoinRoomPayload): number | null {
    const roomId = Number(payload?.roomId);
    return Number.isFinite(roomId) ? roomId : null;
  }
}
