import {
  Controller,
  Get,
  Route,
  Tags,
  SuccessResponse,
  Response,
  Request,
  Security,
  Query,
} from 'tsoa';
import { injectable, inject } from 'tsyringe';
import { HighlightListService } from '../services/highlight-list.service';
import { GetMyHighlightListResDto } from '../dtos/highlight.res.dto';
import {
  Result,
  BadRequestError,
  UnauthorizedError,
  InternalServerError,
} from '../../../common/types/result.type';

@Route('highlights')
@Tags('Highlight')
@injectable()
export class HighlightMypageController extends Controller {
  constructor(
    @inject(HighlightListService)
    private highlightListService: HighlightListService,
  ) {
    super();
  }

  /**
   * 마이페이지 - 내가 쓴 하이라이트 목록 조회
   * 아지트 하이라이트 + 커뮤니티 하이라이트 통합 조회
   */
  @SuccessResponse('200', 'OK')
  @Response<BadRequestError>(400, 'Bad Request')
  @Response<UnauthorizedError>(401, 'Unauthorized')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Get('me')
  public async getMyHighlightList(
    @Request() req: any,
    @Query() cursor?: number,
    @Query() limit?: number,
  ): Promise<Result<GetMyHighlightListResDto>> {
    const userId = BigInt(req.user.id);
    const cursorBigInt = cursor ? BigInt(cursor) : null;
    const limitNum = limit || 20;

    const result = await this.highlightListService.getMyHighlightList(
      userId,
      cursorBigInt,
      limitNum,
    );

    this.setStatus(result.statusCode);
    return result;
  }
}
