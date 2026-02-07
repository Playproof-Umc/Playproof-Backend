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
  Path,
  Query,
  Patch,
  Delete,
} from 'tsoa/dist';
import { inject, injectable } from 'tsyringe';
import { FriendService } from '../services/friend.service';
import { FriendRequestReqDto } from '../dto/friend.req.dto';
import { Result } from '../../../common/types/result.type';
import {
  FriendAcceptResDto,
  FriendItemResDto,
  FriendListResDto,
  FriendRequestResDto,
} from '../dto/friend.res.dto';

@Route('friends')
@Tags('Friend')
@injectable()
export class FriendController extends Controller {
  constructor(
    @inject(FriendService) private readonly friendService: FriendService,
  ) {
    super();
  }
  // 내 친구들 목록 조회
  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Get('')
  async getFriendList(
    @Request() req: any,
  ): Promise<Result<FriendItemResDto[]>> {
    const userId = req.user.id;
    const result = await this.friendService.getFriendList(userId);
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Post('/requests')
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
  @Get('/requests/sent')
  async getSentFriendList(
    @Request() req: any,
  ): Promise<Result<FriendListResDto>> {
    const userId = req.user.id;
    const result = await this.friendService.getSentFriendList(userId);
    this.setStatus(result.statusCode);
    return result;
  }

  // 나에게 온 친구 신청자 목록을 조회
  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Get('/requests/received')
  async getReceivedFriendList(
    @Request() req: any,
  ): Promise<Result<FriendListResDto>> {
    const userId = req.user.id;
    const result = await this.friendService.getReceivedFriendList(userId);
    this.setStatus(result.statusCode);
    return result;
  }

  // 친구 수락하기
  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Patch('/requests/{requestId}')
  async acceptFriendRequest(
    @Request() req: any,
    @Path() requestId: number,
  ): Promise<Result<FriendAcceptResDto>> {
    const userId = req.user.id;
    const result = await this.friendService.acceptFriendRequest(
      userId,
      requestId,
    );
    this.setStatus(result.statusCode);
    return result;
  }

  // 친구 삭제
  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Delete('/{friendId}')
  async deleteFriend(
    @Request() req: any,
    @Path() friendId: number,
  ): Promise<Result<number>> {
    const userId = req.user.id;
    const result = await this.friendService.deleteFriend(userId, friendId);
    this.setStatus(result.statusCode);
    return result;
  }

  // 친구 닉네임으로 검색하기
  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Get('/search')
  async searchFriendByNickname(
    @Request() req: any,
    @Query() nickname: string,
  ): Promise<Result<FriendItemResDto[]>> {
    const userId = req.user.id;
    const result = await this.friendService.searchFriendByNickname(
      userId,
      nickname,
    );
    this.setStatus(result.statusCode);
    return result;
  }
}
