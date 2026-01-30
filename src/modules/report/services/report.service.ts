// src/modules/report/services/report.service.ts
import { injectable, inject } from "tsyringe";
import { ReportRepository } from "../repositories/report.repository";
import { ReportValidator } from "../utils/report.validator";
import { ReportCreateReqDto, ReportListReqDto } from "../dtos/report.req.dto";
import { ReportCreateResDto, ReportListResDto, ReportListItemDto } from "../dtos/report.res.dto";
import {
  Result,
  ok,
  created,
  internalServerError,
} from "../../../common/types/result.type";
import { uploadFileToS3 } from "../../../common/utils/file-util";
import { ReportType } from "@prisma/client";

@injectable()
export class ReportService {
  constructor(
    @inject(ReportRepository) private reportRepository: ReportRepository,
    @inject(ReportValidator) private reportValidator: ReportValidator,
  ) {}

  async createReport(
    userId: bigint,
    dto: ReportCreateReqDto,
    files: Express.Multer.File[] | undefined,
  ): Promise<Result<ReportCreateResDto>> {
    const targetId = BigInt(dto.target_id);

    // 1. 자기 자신 신고 방지
    const selfReportError = this.reportValidator.validateNotSelfReport<ReportCreateResDto>(
      userId,
      targetId,
    );
    if (selfReportError) {
      return selfReportError;
    }

    // 2. 신고 대상 사용자 존재 확인
    const targetUserError = await this.reportValidator.validateTargetUser<ReportCreateResDto>(
      targetId,
    );
    if (targetUserError) {
      return targetUserError;
    }

    // 3. 미디어 파일 검증
    const mediaValidationError = this.reportValidator.validateMediaFiles(files);
    if (mediaValidationError) {
      return mediaValidationError;
    }

    // 4. S3에 파일 업로드
    const mediaUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const uploadResult = await uploadFileToS3(file, 'reports');
        if (uploadResult.error) {
          return uploadResult;
        }
        mediaUrls.push(uploadResult.data);
      }
    }

    // 5. ReportType 변환
    const reportType: ReportType = dto.report_type as ReportType;

    // 6. 신고 생성 및 미디어 일괄 생성 
    const report = await this.reportRepository.createReportWithMedias(
      userId,
      targetId,
      dto.name,
      dto.email || null,
      reportType,
      dto.title,
      dto.content,
      mediaUrls,
    );

    // 7. 응답 DTO 변환
    const response: ReportCreateResDto = {
      report_id: Number(report.id),
      report_status: report.reportStatus,
      created_at: report.createdAt,
    };

    return created(response);
  }

  /**
   * 신고 전체 조회 
   */
  async getReportList(
    userId: bigint,
    dto: ReportListReqDto,
  ): Promise<Result<ReportListResDto>> {
    const { page, size, sort } = dto;
    const [reports, totalCount] = await Promise.all([
      this.reportRepository.findReportsByUserId(userId, page, size, sort),
      this.reportRepository.countReportsByUserId(userId),
    ]);

    const hasNext = page * size < totalCount;
    const items: ReportListItemDto[] = reports.map((r) => ({
      target_name: r.name,
      type: r.reportType,
      status: r.reportStatus,
      title: r.title,
      created_at: r.createdAt,
    }));

    return ok({
      reports: items,
      nextCursor: hasNext ? page + 1 : null,
      hasNext,
    });
  }
}
