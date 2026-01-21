import { AccessToken } from 'livekit-server-sdk';
import { inject, injectable } from 'tsyringe';
import { livekitConfig } from '../../../common/config/livekit';
import {
  Result,
  internalServerError,
  isSuccess,
  ok,
} from '../../../common/types/result.type';
import { UserRepository } from '../../user/user.repository';
import { ChatService } from '../../chat/service/chat.service';
import { VoiceTokenResDto } from '../dtos/voice.res.dto';
import { validateRoomAccess, validateUserExists } from '../utils/voice.validator';

const CHAT_ROOM_PREFIX = 'chatRoom:';

@injectable()
export class VoiceService {
  constructor(
    @inject(ChatService) private chatService: ChatService,
    @inject(UserRepository) private userRepository: UserRepository,
  ) {}

  async issueVoiceToken(
    roomId: number,
    userId: number,
  ): Promise<Result<VoiceTokenResDto>> {
    const access = await validateRoomAccess(
      this.chatService,
      roomId,
      userId,
    );
    if (!isSuccess(access)) return access;

    const userResult = await validateUserExists(userId, this.userRepository);
    if (!isSuccess(userResult)) return userResult;

    const user = userResult.data;
    const identity = String(userId);
    const name = user.nickname ?? `User${userId}`;
    const roomName = `${CHAT_ROOM_PREFIX}${roomId}`;

    try {
      const token = new AccessToken(
        livekitConfig.apiKey,
        livekitConfig.apiSecret,
        {
          identity,
          name,
        },
      );

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
      console.error('Failed to issue LiveKit token:', error);
      return internalServerError({
        message: 'LiveKit 토큰 발급에 실패했습니다.',
      });
    }
  }
}
