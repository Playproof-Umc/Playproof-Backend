// src/modules/azit/controllers/report.controller.ts
import { injectable, inject } from "tsyringe";
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
  UploadedFiles,
  FormField,
} from "tsoa";
import { ReportService } from "../services/report.service";
import { ReportCreateReqDto, ReportTypeEnum } from "../dtos/report.req.dto";
import { ReportCreateResDto } from "../dtos/report.res.dto";
import {
  Result,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  InternalServerError,
} from "../../../common/types/result.type";
import { validationMiddleware } from "../../../common/middlewares/validation";

@Route("azits")
@Tags("Report")
@injectable()
export class ReportController extends Controller {
  constructor(
    @inject(ReportService) private reportService: ReportService,
  ) {
    super();
  }

  /**
   * 신고 생성
   * 신고를 생성합니다.
   */
  @SuccessResponse("201", "Created")
  @Response<BadRequestError>(400, "Bad Request")
  @Response<UnauthorizedError>(401, "Unauthorized")
  @Response<NotFoundError>(404, "Not Found")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Middlewares(validationMiddleware(ReportCreateReqDto))
  @Post("reports")
  public async createReport(
    @Request() req: any,
    @FormField() target_id: number,
    @FormField() name: string,
    @FormField() report_type: ReportTypeEnum,
    @FormField() title: string,
    @FormField() content: string,
    @FormField() email?: string,
    @UploadedFiles() medias?: Express.Multer.File[],
  ): Promise<Result<ReportCreateResDto>> {
    const userId = BigInt(req.user.id);

    const dto = req.body as ReportCreateReqDto;

    const result = await this.reportService.createReport(
      userId,
      dto,
      medias,
    );

    this.setStatus(result.statusCode);
    return result;
  }
}
