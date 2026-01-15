// src/modules/azit/controllers/azit-schedule.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Route,
  Tags,
  SuccessResponse,
  Response,
  Request,
  Security,
  Middlewares,
  Path,
  Body,
  Query,
} from 'tsoa';
import { injectable, inject } from 'tsyringe';
import { AzitScheduleService } from '../services/azit-schedule.service';
import {
  AzitScheduleCreateReqDto,
  AzitScheduleUpdateReqDto,
} from '../dtos/azit-schedule.req.dto';
import {
  AzitScheduleCreateResDto,
  AzitScheduleListResDto,
} from '../dtos/azit-schedule.res.dto';
import {
  Result,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} from '../../../common/types/result.type';
import { validationMiddleware } from '../../../common/middlewares/validation';

@Route('azits/{azit_id}/schedules')
@Tags('Azit Schedule')
@injectable()
export class AzitScheduleController extends Controller {
  constructor(
    @inject(AzitScheduleService)
    private azitScheduleService: AzitScheduleService,
  ) {
    super();
  }

  @SuccessResponse('201', 'Created')
  @Response<ForbiddenError>(403, 'Forbidden')
  @Response<NotFoundError>(404, 'Not Found')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Middlewares(validationMiddleware(AzitScheduleCreateReqDto))
  @Post('/')
  public async createSchedule(
    @Request() req: any,
    @Path() azit_id: number,
    @Body() requestBody: AzitScheduleCreateReqDto,
  ): Promise<Result<AzitScheduleCreateResDto>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);

    const result = await this.azitScheduleService.createSchedule(
      userId,
      azitId,
      requestBody,
    );

    this.setStatus(result.statusCode);

    return result;
  }

  @SuccessResponse('200', 'OK')
  @Response<ForbiddenError>(403, 'Forbidden')
  @Response<NotFoundError>(404, 'Not Found')
  @Security('jwt')
  @Get('/')
  public async getSchedules(
    @Request() req: any,
    @Path() azit_id: number,
    @Query() cursor?: string,
    @Query() size?: number,
  ): Promise<Result<AzitScheduleListResDto>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);
    const pageSize = size || 10;

    const result = await this.azitScheduleService.getSchedules(
      userId,
      azitId,
      cursor,
      pageSize,
    );

    this.setStatus(result.statusCode);

    return result;
  }

  @SuccessResponse('200', 'OK')
  @Response<ForbiddenError>(403, 'Forbidden')
  @Response<NotFoundError>(404, 'Not Found')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Middlewares(validationMiddleware(AzitScheduleUpdateReqDto))
  @Patch('/{schedule_id}')
  public async updateSchedule(
    @Request() req: any,
    @Path() azit_id: number,
    @Path() schedule_id: number,
    @Body() requestBody: AzitScheduleUpdateReqDto,
  ): Promise<Result<AzitScheduleCreateResDto>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);
    const scheduleId = BigInt(schedule_id);

    const result = await this.azitScheduleService.updateSchedule(
      userId,
      azitId,
      scheduleId,
      requestBody,
    );

    this.setStatus(result.statusCode);

    return result;
  }

  @SuccessResponse('204', 'No Content')
  @Response<ForbiddenError>(403, 'Forbidden')
  @Response<NotFoundError>(404, 'Not Found')
  @Security('jwt')
  @Delete('/{schedule_id}')
  public async deleteSchedule(
    @Request() req: any,
    @Path() azit_id: number,
    @Path() schedule_id: number,
  ): Promise<Result<null>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);
    const scheduleId = BigInt(schedule_id);

    const result = await this.azitScheduleService.deleteSchedule(
      userId,
      azitId,
      scheduleId,
    );

    this.setStatus(result.statusCode);

    return result;
  }
}
