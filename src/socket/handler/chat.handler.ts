import { Server, Socket } from "socket.io";
import { container } from "tsyringe";
import { ChatService } from "../../modules/chat/service/chat.service";
import { isSuccess } from "../../common/types/result.type";
import { JoinRoomPayload, SendMessagePayload, SocketAuthData } from "../types";
import { getRoomKey } from "../utils/rooms";

type Ack = (data: unknown) => void;

export class ChatRoomHandler {
  private chatService: ChatService;

  constructor(private io: Server) {
    this.chatService = container.resolve(ChatService);
  }

  async handleJoinRoom(socket: Socket, payload: JoinRoomPayload, ack?: Ack) {
    const authData = socket.data as SocketAuthData;
    const { userId } = authData;
    const roomId = this.parseRoomId(payload);
    if (!roomId) {
      const response = { code: "INVALID_ROOM", message: "roomId가 올바르지 않습니다." };
      socket.emit("error", response);
      ack?.({ ok: false, error: response });
      return;
    }

    const result = await this.chatService.joinRoom(roomId, userId);
    if (!isSuccess(result)) {
      socket.emit("error", result.error);
      ack?.({ ok: false, error: result.error });
      return;
    }

    socket.join(getRoomKey(roomId));
    ack?.({ ok: true, data: result.data });
  }

  handleLeaveRoom(socket: Socket, payload: JoinRoomPayload) {
    const roomId = this.parseRoomId(payload);
    if (!roomId) {
      socket.emit("error", { code: "INVALID_ROOM", message: "roomId가 올바르지 않습니다." });
      return;
    }
    socket.leave(getRoomKey(roomId));
  }

  async handleSendMessage(socket: Socket, payload: SendMessagePayload, ack?: Ack) {
    const authData = socket.data as SocketAuthData;
    const { userId } = authData;
    const roomId = this.parseRoomId(payload);
    if (!roomId || !payload?.content?.trim()) {
      const response = { code: "INVALID_MESSAGE", message: "메시지 입력이 올바르지 않습니다." };
      socket.emit("error", response);
      ack?.({ ok: false, error: response });
      return;
    }

    const result = await this.chatService.sendMessage(roomId, userId, payload.content.trim());
    if (!isSuccess(result)) {
      socket.emit("error", result.error);
      ack?.({ ok: false, error: result.error });
      return;
    }

    // 메시지 전송 알림
    this.io.to(getRoomKey(roomId)).emit("newMessage", result.data);
    ack?.({ ok: true, data: result.data });
  }

  private parseRoomId(payload: JoinRoomPayload): number | null {
    const roomId = Number(payload?.roomId);
    return Number.isFinite(roomId) ? roomId : null;
  }
}
