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
  UploadedFile,
} from 'tsoa';
import { inject, injectable } from 'tsyringe';
import { ChatService } from '../service/chat.service';
import {
  ChatMessageListResDto,
  ChatMessageResDto,
  ChatRoomGetResDto,
  ChatRoomInviteResDto,
  ChatRoomMemberResDto,
} from '../dtos/chat.res.dto';
import { ok, Result } from '../../../common/types/result.type';
import {
  ChatMessageCreateReqDto,
  ChatRoomInviteReqDto,
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

  /**
   * 채팅 이미지 업로드
   * 파일을 S3에 업로드하고 URL을 반환합니다. 반환된 URL을 메시지 전송 시 mediaUrls에 포함하세요.
   */
  @SuccessResponse('201', 'Created')
  @Security('jwt')
  @Post('{roomId}/upload')
  public async uploadChatImage(
    @Path() roomId: number,
    @Request() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Result<{ mediaUrl: string }>> {
    const userId = Number(req.user.id);
    const result = await this.chatService.uploadChatImage(roomId, userId, file);
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
      dto.content ?? '',
      dto.mediaUrls,
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

  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Middlewares(validationMiddleware(ChatRoomInviteReqDto))
  @Post('{roomId}/invite')
  public async inviteToChatRoom(
    @Path() roomId: number,
    @Request() req: any,
    @Body() dto: ChatRoomInviteReqDto,
  ): Promise<Result<ChatRoomInviteResDto>> {
    const userId = Number(req.user.id);
    const result = await this.chatService.inviteToChatRoom(roomId, userId, dto);
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Get('{roomId}/members')
  public async getPrivateRoomMembers(
    @Path() roomId: number,
    @Request() req: any,
  ): Promise<Result<ChatRoomMemberResDto[]>> {
    const userId = Number(req.user.id);
    const result = await this.chatService.getPrivateRoomMembers(roomId, userId);
    this.setStatus(result.statusCode);
    return result;
  }
}
