// src/modules/report/controllers/report.controller.ts
import { injectable, inject } from "tsyringe";
import {
  Controller,
  Get,
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
  Query,
  Path,
} from "tsoa";
import { ReportService } from "../services/report.service";
import { ReportCreateReqDto, ReportListReqDto, ReportTypeEnum } from "../dtos/report.req.dto";
import { ReportCreateResDto, ReportListResDto, ReportDetailResDto } from "../dtos/report.res.dto";
import {
  Result,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  InternalServerError,
  ForbiddenError,
} from "../../../common/types/result.type";
import { validationMiddleware } from "../../../common/middlewares/validation";

@Route("reports")
@Tags("Report")
@injectable()
export class ReportController extends Controller {
  constructor(
    @inject(ReportService) private reportService: ReportService,
  ) {
    super();
  }

  /**
   * 신고 전체 조회
   * 현재 사용자가 신고한 목록을 페이지네이션으로 조회합니다.
   */
  @SuccessResponse("200", "OK")
  @Response<BadRequestError>(400, "Bad Request")
  @Response<UnauthorizedError>(401, "Unauthorized")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Get("/")
  public async getReportList(
    @Request() req: any,
    @Query() page: number = 1,
    @Query() size: number = 10,
    @Query() sort: "latest" | "oldest" = "latest",
  ): Promise<Result<ReportListResDto>> {
    const userId = BigInt(req.user.id);
    const result = await this.reportService.getReportList(userId, { page, size, sort });
    this.setStatus(result.statusCode);
    return result;
  }

  /**
   * 신고 상세 조회
   * 신고 ID로 신고의 상세 정보를 조회합니다.
   */
  @SuccessResponse("200", "OK")
  @Response<UnauthorizedError>(401, "Unauthorized")
  @Response<ForbiddenError>(403, "Forbidden")
  @Response<NotFoundError>(404, "Not Found")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Get("/{reportId}")
  public async getReportDetail(
    @Request() req: any,
    @Path() reportId: number,
  ): Promise<Result<ReportDetailResDto>> {
    const userId = BigInt(req.user.id);
    const result = await this.reportService.getReportDetail(userId, reportId);
    this.setStatus(result.statusCode);
    return result;
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
  @Post("/")
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
