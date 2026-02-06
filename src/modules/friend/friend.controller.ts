import {
  Controller,
  Route,
  Security,
  Tags,
  SuccessResponse,
  Post,
  Request,
  Body,
  Get,
} from 'tsoa/dist';
import { inject, injectable } from 'tsyringe';
import { FriendService } from './friend.service';
import { FriendRequestReqDto } from './dto/friend.req.dto';
import { Result } from '../../common/types/result.type';
import { FriendItemResDto, FriendListResDto, FriendRequestResDto } from './dto/friend.res.dto';

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

  // 내가 신청했던 친구들의 목록을 조회(Pending, Accepted 모두 포함)
  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Get('/list')
  async getSentFriendList(@Request() req: any): Promise<Result<FriendListResDto>> {
    const userId = req.user.id;
    const result = await this.friendService.getSentFriendList(userId);
    this.setStatus(result.statusCode);
    return result;
  }

  // 나에게 온 친구 신청자 목록을 조회
  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Get('/request/list')
  async getReceivedFriendList(@Request() req: any): Promise<Result<FriendListResDto>> {
    const userId = req.user.id;
    const result = await this.friendService.getReceivedFriendList(userId);
    this.setStatus(result.statusCode);
    return result;
  }
}
