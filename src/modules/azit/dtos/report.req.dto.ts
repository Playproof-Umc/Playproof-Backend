// src/modules/azit/dtos/report.req.dto.ts
import { IsString, IsEnum, IsOptional, MaxLength, IsEmail, MinLength, IsInt, Min, ValidateIf } from "class-validator";
import { Type } from "class-transformer";

export enum ReportTypeEnum {
  FEEDBACK_APPEAL = "FEEDBACK_APPEAL",
  REPORT_USER = "REPORT_USER",
  SERVICE_INQUIRY = "SERVICE_INQUIRY",
}

export class ReportCreateReqDto {
  /**
   * 신고 대상 사용자 ID
   * @example 1002
   */
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: "target_id는 1 이상의 숫자여야 합니다." })
  target_id!: number;

  /**
   * 신고자 이름
   * @example "홍길동"
   */
  @IsString()
  @MinLength(1, { message: "name은 필수입니다." })
  @MaxLength(50, { message: "name은 50글자를 초과할 수 없습니다." })
  name!: string;

  /**
   * 신고자 이메일 (선택)
   * @example "example@email.com"
   */
  @IsOptional()
  @ValidateIf((o) => (o.email ?? "").trim() !== "")
  email?: string;

  /**
   * 신고 유형
   * @example "REPORT_USER"
   */
  @IsEnum(ReportTypeEnum, {
    message: "report_type은 FEEDBACK_APPEAL, REPORT_USER, SERVICE_INQUIRY 중 하나여야 합니다.",
  })
  report_type!: ReportTypeEnum;

  /**
   * 신고 제목
   * @example "부적절한 행동 신고"
   */
  @IsString()
  @MinLength(1, { message: "title은 필수입니다." })
  @MaxLength(200, { message: "title은 200글자를 초과할 수 없습니다." })
  title!: string;

  /**
   * 신고 내용
   * @example "해당 사용자가 부적절한 언어를 사용했습니다."
   */
  @IsString()
  @MinLength(1, { message: "content는 필수입니다." })
  @MaxLength(2000, { message: "content는 2000글자를 초과할 수 없습니다." })
  content!: string;
}
