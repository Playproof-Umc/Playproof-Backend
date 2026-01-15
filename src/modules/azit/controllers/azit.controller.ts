// src/modules/azit/controllers/azit.controller.ts
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
  UploadedFile,
  FormField,
  Path,
} from 'tsoa';
import { injectable, inject } from 'tsyringe';
import { AzitService } from '../services/azit.service';
import { AzitCreateReqDto, AzitUpdateReqDto } from '../dtos/azit.req.dto';
import { AzitResDto, AzitListResDto } from '../dtos/azit.res.dto';
import {
  Result,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from '../../../common/types/result.type';
import { validationMiddleware } from '../../../common/middlewares/validation';

@Route('azits')
@Tags('Azit')
@injectable()
export class AzitController extends Controller {
  constructor(@inject(AzitService) private azitService: AzitService) {
    super();
  }

  @SuccessResponse('201', 'Created')
  @Response<ConflictError>(409, 'Conflict')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Middlewares(validationMiddleware(AzitCreateReqDto))
  @Post('/')
  public async createAzit(
    @Request() req: any,
    @FormField('azit_name') azit_name: string, // Swagger 문서화용 (사용 안 함)
    @UploadedFile('azit_icon') azit_icon?: Express.Multer.File,
  ): Promise<Result<AzitResDto>> {
    const userId = BigInt(req.user.id);
    const result = await this.azitService.createAzit(
      userId,
      req.body,
      azit_icon,
    );

    this.setStatus(result.statusCode);

    return result;
  }

  @SuccessResponse('200', 'OK')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Get('/')
  public async getAzits(@Request() req: any): Promise<Result<AzitListResDto>> {
    const userId = BigInt(req.user.id);
    const result = await this.azitService.getAzitsByUserId(userId);

    this.setStatus(result.statusCode);

    return result;
  }

  @SuccessResponse('200', 'OK')
  @Response<ForbiddenError>(403, 'Forbidden')
  @Response<NotFoundError>(404, 'Not Found')
  @Response<ConflictError>(409, 'Conflict')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Middlewares(validationMiddleware(AzitUpdateReqDto))
  @Patch('/{azit_id}')
  public async updateAzit(
    @Request() req: any,
    @Path() azit_id: number,
    @FormField('azit_name') azit_name?: string | null, // Swagger 문서화용 (사용 안 함)
    @FormField('is_delete_icon') is_delete_icon?: boolean, // Swagger 문서화용 (사용 안 함)
    @UploadedFile('azit_icon') azit_icon?: Express.Multer.File,
  ): Promise<Result<AzitResDto>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);

    const result = await this.azitService.updateAzit(
      userId,
      azitId,
      req.body,
      azit_icon,
    );

    this.setStatus(result.statusCode);

    return result;
  }

  @SuccessResponse('200', 'OK')
  @Response<ForbiddenError>(403, 'Forbidden')
  @Response<NotFoundError>(404, 'Not Found')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Delete('/{azit_id}')
  public async deleteAzit(
    @Request() req: any,
    @Path() azit_id: number,
  ): Promise<Result<null>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);

    const result = await this.azitService.deleteAzit(userId, azitId);

    this.setStatus(result.statusCode);

    return result;
  }
}
