// src/modules/azit/controllers/azit-schedule-participation.controller.ts
import { injectable, inject } from 'tsyringe';
import {
  Controller,
  Delete,
  Path,
  Post,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';

import { AzitScheduleParticipationResDto } from '../dtos/azit-schedule-participation.res.dto';
import { AzitScheduleParticipationService } from '../services/azit-schedule-participation.service';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  Result,
} from '../../../common/types/result.type';

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

  @SuccessResponse('201', 'Created')
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
  ): Promise<Result<AzitScheduleParticipationResDto>> {
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
