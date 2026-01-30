
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

/** 신고 목록 항목 */
export class ReportListItemDto {
  /** 신고 대상자 이름 */
  target_name!: string;
  /** 신고 유형 */
  type!: string;
  /** 신고 상태 */
  status!: string;
  /** 제목 */
  title!: string;
  /** 생성 일시 */
  created_at!: Date;
}

/** 신고 전체 조회 응답  */
export class ReportListResDto {
  reports!: ReportListItemDto[];
  /** 다음 페이지 번호 (없으면 null) */
  nextCursor!: number | null;
  /** 다음 페이지 존재 여부 */
  hasNext!: boolean;
}
