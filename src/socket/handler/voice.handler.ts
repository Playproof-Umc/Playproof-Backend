import { Socket } from 'socket.io';
import { container } from 'tsyringe';
import { ChatService } from '../../modules/chat/service/chat.service';
import { isSuccess } from '../../common/types/result.type';
import { JoinRoomPayload, SocketAuthData } from '../types';

type Ack = (data: unknown) => void;

export class VoiceRoomHandler {
  private chatService: ChatService;

  constructor() {
    this.chatService = container.resolve(ChatService);
  }

  async handleVoiceJoin(socket: Socket, payload: JoinRoomPayload, ack?: Ack) {
    const authData = socket.data as SocketAuthData;
    const { userId } = authData;
    const roomId = this.parseRoomId(payload);
    if (!roomId) {
      const response = {
        code: 'INVALID_ROOM',
        message: 'roomId가 올바르지 않습니다.',
      };
      socket.emit('error', response);
      ack?.({ ok: false, error: response });
      return;
    }

    // 모임 참여 권한 확인
    const access = await this.chatService.getRoomAndMember(roomId, userId);
    if (!isSuccess(access)) {
      socket.emit('error', access.error);
      ack?.({ ok: false, error: access.error });
      return;
    }

    // LiveKit에서 참여자 상태를 관리
    ack?.({ ok: true, data: { roomId } });
  }

  handleVoiceLeave(socket: Socket, payload: JoinRoomPayload, ack?: Ack) {
    const roomId = this.parseRoomId(payload);
    if (!roomId) {
      const response = {
        code: 'INVALID_ROOM',
        message: 'roomId가 올바르지 않습니다.',
      };
      socket.emit('error', response);
      ack?.({ ok: false, error: response });
      return;
    }

    // LiveKit에서 참여자 상태를 관리
    ack?.({ ok: true, data: { roomId } });
  }

  private parseRoomId(payload: JoinRoomPayload): number | null {
    const roomId = Number(payload?.roomId);
    return Number.isFinite(roomId) ? roomId : null;
  }
}
