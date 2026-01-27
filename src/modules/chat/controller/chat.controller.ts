import {
  Controller,
  Get,
  Path,
  Query,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { inject, injectable } from 'tsyringe';
import { ChatService } from '../service/chat.service';
import { ChatMessageListResDto } from '../dtos/chat.res.dto';
import { Result } from '../../../common/types/result.type';

@Route('chat-rooms')
@Tags('Chat')
@injectable()
export class ChatController extends Controller {
  constructor(@inject(ChatService) private chatService: ChatService) {
    super();
  }

  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Get('{roomId}/messages')
  public async getMessages(
    @Path() roomId: number,
    @Request() req: any,
    @Query() size: number = 50,
    @Query() cursor?: number,
  ): Promise<Result<ChatMessageListResDto>> {
    const userId = Number(req.user.id);
    const result = await this.chatService.getMessages(roomId, userId, {
      size,
      cursor,
    });
    this.setStatus(result.statusCode);
    return result;
  }
}
