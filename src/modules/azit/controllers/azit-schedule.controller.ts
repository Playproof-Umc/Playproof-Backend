// src/modules/azit/controllers/azit-schedule.controller.ts
import {
  Controller,
  Post,
  Route,
  Tags,
  SuccessResponse,
  Response,
  Request,
  Security,
  Middlewares,
  Path,
  Body,
} from 'tsoa';
import { injectable, inject } from 'tsyringe';
import { AzitScheduleService } from '../services/azit-schedule.service';
import { AzitScheduleCreateReqDto } from '../dtos/azit-schedule.req.dto';
import { AzitScheduleCreateResDto } from '../dtos/azit-schedule.res.dto';
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
}
