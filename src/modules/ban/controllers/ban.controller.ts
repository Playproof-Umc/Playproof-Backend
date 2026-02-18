// src/modules/ban/controllers/ban.controller.ts

import {
  Controller,
  Get,
  Delete,
  Route,
  SuccessResponse,
  Middlewares,
  Tags,
  Response,
  Query,
  Path,
  Request,
  Security,
} from 'tsoa';
import { injectable, inject } from 'tsyringe';
import { BanService } from '../services/ban.service';
import { SearchBanReqDto } from '../dtos/ban.req.dto';
import {
  GetBanListResDto,
  DeleteBanResDto,
  SearchBanResDto,
} from '../dtos/ban.res.dto';
import {
  Result,
  BadRequestError,
  NotFoundError,
  InternalServerError,
} from '../../../common/types/result.type';

@injectable()
@Route('bans')
@Tags('Ban')
export class BanController extends Controller {
  constructor(@inject(BanService) private banService: BanService) {
    super();
  }

  /**
   * 내가 차단한 유저 목록 조회
   */
  @SuccessResponse('200', 'OK')
  @Response<BadRequestError>(400, 'Bad Request')
  @Response<NotFoundError>(404, 'Not Found')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Get('/')
  public async getBanList(
    @Request() req: any,
  ): Promise<Result<GetBanListResDto>> {
    const userId = req.user.id;
    const result = await this.banService.getBanList({ userId });
    this.setStatus(result.statusCode);
    return result;
  }

  /**
   * 차단한 유저 닉네임 검색
   * @param q 검색할 닉네임
   */
  @SuccessResponse('200', 'OK')
  @Response<BadRequestError>(400, 'Bad Request')
  @Response<NotFoundError>(404, 'Not Found')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Get('/search')
  public async searchBan(
    @Request() req: any,
    @Query() q: string,
  ): Promise<Result<SearchBanResDto>> {
    const userId = req.user.id; 
    const result = await this.banService.searchBan({ userId, q });
    this.setStatus(result.statusCode);
    return result;
  }

  /**
   * 차단 해제
   * @param targetId 차단 해제할 유저 ID
   */
  @SuccessResponse('200', 'OK')
  @Response<BadRequestError>(400, 'Bad Request')
  @Response<NotFoundError>(404, 'Not Found')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Delete('/{targetId}')
  public async deleteBan(
    @Request() req: any,
    @Path() targetId: number,
  ): Promise<Result<DeleteBanResDto>> {
    const userId = req.user.id; 
    const result = await this.banService.deleteBan({ userId, targetId });
    this.setStatus(result.statusCode);
    return result;
  }
}