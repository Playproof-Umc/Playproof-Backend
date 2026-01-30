// src/modules/azit/dtos/report.res.dto.ts

export class ReportCreateResDto {
  /**
   * 신고 ID
   * @example 1
   */
  report_id!: number;

  /**
   * 신고 상태
   * @example "PENDING"
   */
  report_status!: string;

  /**
   * 생성 일시
   * @example "2025-01-09T14:30:00Z"
   */
  created_at!: Date;
}
