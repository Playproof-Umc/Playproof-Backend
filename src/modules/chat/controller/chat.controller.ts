import {
  Body,
  Controller,
  Delete,
  Get,
  Middlewares,
  Post,
  Patch,
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
import {
  ChatMessageListResDto,
  ChatMessageResDto,
  ChatRoomGetResDto,
} from '../dtos/chat.res.dto';
import { ok, Result } from '../../../common/types/result.type';
import {
  ChatMessageCreateReqDto,
  ChatRoomUpdateReqDto,
} from '../dtos/chat.req.dto';
import { validationMiddleware } from '../../../common/middlewares/validation';

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

  @SuccessResponse('201', 'Created')
  @Security('jwt')
  @Middlewares(validationMiddleware(ChatMessageCreateReqDto))
  @Post('{roomId}/messages')
  public async createMessage(
    @Path() roomId: number,
    @Request() req: any,
    @Body() dto: ChatMessageCreateReqDto,
  ): Promise<Result<ChatMessageResDto>> {
    const userId = Number(req.user.id);
    const result = await this.chatService.sendMessage(
      roomId,
      userId,
      dto.content,
    );
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Delete('{roomId}')
  public async deleteChatRoom(
    @Path() roomId: number,
    @Request() req: any,
  ): Promise<Result<string>> {
    const userId = Number(req.user.id);
    return this.chatService.deleteChatRoom(roomId, userId);
  }

  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Middlewares(validationMiddleware(ChatRoomUpdateReqDto))
  @Patch('{roomId}')
  public async updateChatRoom(
    @Path() roomId: number,
    @Request() req: any,
    @Body() dto: ChatRoomUpdateReqDto,
  ): Promise<Result<ChatRoomGetResDto>> {
    const userId = Number(req.user.id);
    const result = await this.chatService.updateChatRoom(roomId, userId, dto);
    this.setStatus(result.statusCode);
    return result;
  }
}
