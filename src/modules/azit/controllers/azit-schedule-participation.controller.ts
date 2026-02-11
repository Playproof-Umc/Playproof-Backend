// src/modules/azit/controllers/azit-schedule-participation.controller.ts
import { injectable, inject } from 'tsyringe';
import {
  Body,
  Controller,
  Delete,
  Get,
  Middlewares,
  Patch,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';

import { AzitScheduleParticipationUpdateReqDto } from '../dtos/azit-schedule.req.dto';
import { AzitScheduleParticipationService } from '../services/azit-schedule-participation.service';
import { AzitScheduleParticipationStatus } from '../types/azit-schedule-participation-status';
import { validationMiddleware } from '../../../common/middlewares/validation';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  Result,
} from '../../../common/types/result.type';
import {
  AzitScheduleMyParticipationResDto,
  AzitScheduleParticipantsResDto,
} from '../dtos/azit-schedule.res.dto';

@Route('azits/{azit_id}/schedules/{schedule_id}/participants')
@Tags('Azit Schedule Participation')
@injectable()
export class AzitScheduleParticipationController extends Controller {
  constructor(
    @inject(AzitScheduleParticipationService)
    private azitScheduleParticipationService: AzitScheduleParticipationService,
  ) {
    super();
  }

  @SuccessResponse('204', 'No Content')
  @Response<BadRequestError>(400, 'Bad Request')
  @Response<ForbiddenError>(403, 'Forbidden')
  @Response<NotFoundError>(404, 'Not Found')
  @Response<ConflictError>(409, 'Conflict')
  @Security('jwt')
  @Post('/')
  public async participateSchedule(
    @Request() req: any,
    @Path() azit_id: number,
    @Path() schedule_id: number,
  ): Promise<Result<null>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);
    const scheduleId = BigInt(schedule_id);

    const result =
      await this.azitScheduleParticipationService.participateSchedule(
        userId,
        azitId,
        scheduleId,
      );

    this.setStatus(result.statusCode);

    return result;
  }

  @SuccessResponse('200', 'OK')
  @Response<ForbiddenError>(403, 'Forbidden')
  @Response<NotFoundError>(404, 'Not Found')
  @Security('jwt')
  @Get('/me')
  public async getMyParticipationStatus(
    @Request() req: any,
    @Path() azit_id: number,
    @Path() schedule_id: number,
  ): Promise<Result<AzitScheduleMyParticipationResDto>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);
    const scheduleId = BigInt(schedule_id);

    const result =
      await this.azitScheduleParticipationService.getMyParticipationStatus(
        userId,
        azitId,
        scheduleId,
      );

    this.setStatus(result.statusCode);

    return result;
  }

  @SuccessResponse('200', 'OK')
  @Response<ForbiddenError>(403, 'Forbidden')
  @Response<NotFoundError>(404, 'Not Found')
  @Security('jwt')
  @Get('/')
  public async getParticipantsByStatus(
    @Request() req: any,
    @Path() azit_id: number,
    @Path() schedule_id: number,
    @Query() status: AzitScheduleParticipationStatus,
  ): Promise<Result<AzitScheduleParticipantsResDto>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);
    const scheduleId = BigInt(schedule_id);

    const result =
      await this.azitScheduleParticipationService.getParticipantsByStatus(
        userId,
        azitId,
        scheduleId,
        status,
      );

    this.setStatus(result.statusCode);

    return result;
  }

  @SuccessResponse('204', 'No Content')
  @Response<BadRequestError>(400, 'Bad Request')
  @Response<ForbiddenError>(403, 'Forbidden')
  @Response<NotFoundError>(404, 'Not Found')
  @Response<ConflictError>(409, 'Conflict')
  @Security('jwt')
  @Middlewares(validationMiddleware(AzitScheduleParticipationUpdateReqDto))
  @Patch('/')
  public async updateParticipationStatus(
    @Request() req: any,
    @Path() azit_id: number,
    @Path() schedule_id: number,
    @Body() requestBody: AzitScheduleParticipationUpdateReqDto,
  ): Promise<Result<null>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);
    const scheduleId = BigInt(schedule_id);

    const result =
      await this.azitScheduleParticipationService.updateParticipationStatus(
        userId,
        azitId,
        scheduleId,
        requestBody.is_participation,
      );

    this.setStatus(result.statusCode);

    return result;
  }

  @SuccessResponse('204', 'No Content')
  @Response<ForbiddenError>(403, 'Forbidden')
  @Response<NotFoundError>(404, 'Not Found')
  @Security('jwt')
  @Delete('/')
  public async cancelParticipation(
    @Request() req: any,
    @Path() azit_id: number,
    @Path() schedule_id: number,
  ): Promise<Result<null>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);
    const scheduleId = BigInt(schedule_id);

    const result =
      await this.azitScheduleParticipationService.cancelParticipation(
        userId,
        azitId,
        scheduleId,
      );

    this.setStatus(result.statusCode);

    return result;
  }
}
