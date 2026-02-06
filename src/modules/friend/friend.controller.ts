import {
  Controller,
  Route,
  Security,
  Tags,
  SuccessResponse,
  Post,
  Request,
  Body,
} from 'tsoa/dist';
import { inject, injectable } from 'tsyringe';
import { FriendService } from './friend.service';
import { FriendRequestReqDto } from './dto/friend.req.dto';
import { Result } from '../../common/types/result.type';
import { FriendRequestResDto } from './dto/friend.res.dto';

@Route('friends')
@Tags('Friend')
@injectable()
export class FriendController extends Controller {
  constructor(
    @inject(FriendService) private readonly friendService: FriendService,
  ) {
    super();
  }

  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Post('/request')
  async friendRequest(
    @Request() req: any,
    @Body() dto: FriendRequestReqDto,
  ): Promise<Result<FriendRequestResDto>> {
    const userId = req.user.id;
    const result = await this.friendService.friendRequest(userId, dto);
    this.setStatus(result.statusCode);
    return result;
  }
}
