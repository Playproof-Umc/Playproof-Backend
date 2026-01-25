import {
  Body,
  Controller,
  Middlewares,
  Path,
  Post,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { inject, injectable } from 'tsyringe';
import { ChatService } from '../service/chat.service';
import { ChatRoomCreateReqDto } from '../dtos/chat.req.dto';
import { ChatRoomCreateResDto } from '../dtos/chat.res.dto';
import { validationMiddleware } from '../../../common/middlewares/validation';
import { Result } from '../../../common/types/result.type';

@Route('azits')
@Tags('Chat')
@injectable()
export class AzitChatController extends Controller {
  constructor(@inject(ChatService) private chatService: ChatService) {
    super();
  }

  @SuccessResponse('201', 'Created')
  @Security('jwt')
  @Middlewares(validationMiddleware(ChatRoomCreateReqDto))
  @Post('{azitId}/chat')
  public async createChatRoom(
    @Request() req: any,
    @Path() azitId: number,
    @Body() dto: ChatRoomCreateReqDto,
  ): Promise<Result<ChatRoomCreateResDto>> {
    const userId = Number(req.user.id);
    const result = await this.chatService.createChatRoom(azitId, userId, dto);
    this.setStatus(result.statusCode);
    return result;
  }
}
