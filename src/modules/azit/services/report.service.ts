// src/modules/azit/services/report.service.ts
import { injectable, inject } from "tsyringe";
import { ReportRepository } from "../repositories/report.repository";
import { ReportValidator } from "../utils/report.validator";
import { ReportCreateReqDto } from "../dtos/report.req.dto";
import { ReportCreateResDto } from "../dtos/report.res.dto";
import {
  Result,
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
}
