import { AccessToken } from "livekit-server-sdk";
import { inject, injectable } from "tsyringe";
import { livekitConfig } from "../../../common/config/livekit";
import { UserErrorCode } from "../../../common/constants/error-code";
import { Result, internalServerError, isSuccess, notFound, ok } from "../../../common/types/result.type";
import { UserRepository } from "../../user/user.repository";
import { ChatService } from "../../chat/service/chat.service";
import { VoiceTokenResDto } from "../dtos/voice.res.dto";

const CHAT_ROOM_PREFIX = "chatRoom:";

@injectable()
export class VoiceService {
  constructor(
    @inject(ChatService) private chatService: ChatService,
    @inject(UserRepository) private userRepository: UserRepository
  ) {}

  async issueVoiceToken(roomId: number, userId: number): Promise<Result<VoiceTokenResDto>> {
    const access = await this.chatService.getRoomAndMember(roomId, userId);
    if (!isSuccess(access)) return access;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return notFound({
        message: "사용자를 찾을 수 없습니다.",
        errorCode: UserErrorCode.NOT_FOUND,
      });
    }

    const identity = String(userId);
    const name = user.nickname ?? `User${userId}`;
    const roomName = `${CHAT_ROOM_PREFIX}${roomId}`;

    try {
      const token = new AccessToken(livekitConfig.apiKey, livekitConfig.apiSecret, {
        identity,
        name,
      });

      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
      });

      const jwt = await token.toJwt();
      return ok({
        token: jwt,
        url: livekitConfig.url,
        roomName,
        identity,
        name,
      });
    } catch (error) {
      console.error("Failed to issue LiveKit token:", error);
      return internalServerError({
        message: "LiveKit 토큰 발급에 실패했습니다.",
      });
    }
  }
}
