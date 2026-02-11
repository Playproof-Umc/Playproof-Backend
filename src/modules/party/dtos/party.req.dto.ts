import { IsBoolean, IsNumber, IsOptional, IsString, ValidateIf } from "class-validator";

export class PartyCreateReqDto {
  /**
   * @example 1
   */
  @IsNumber()
  gameId!: number;

  /**
   * @example "파티 제목"
   */
  @IsString()
  title!: string;

  /**
   * @example "파티 내용"
   */
  @IsString()
  memo!: string;

  /**
   * @example 1
   */
  @IsNumber()
  recruitmentPeople!: number;

  /**
   * @example 1
   */
  @IsNumber()
  tierId!: number;

  /**
   * @example [1]
   */
  @IsNumber({}, { each: true })
  positionIds!: number[];

  /**
   * @example true
   */
  @IsBoolean()
  isMicUse!: boolean;

  /**
   * @example 1
   */
  @IsNumber()
  azitId!: number;
}

export class PartyUpdateReqDto {
  /**
   * @example 1
   */
  @IsOptional()
  @IsNumber()
  gameId?: number;

  /**
   * @example "수정된 파티 제목"
   */
  @IsOptional()
  @IsString()
  title?: string;

  /**
   * @example "수정된 파티 내용"
   */
  @IsOptional()
  @IsString()
  memo?: string;

  /**
   * @example 1
   */
  @IsOptional()
  @IsNumber()
  recruitmentPeople?: number;

  /**
   * @example 1
   */
  @IsOptional()
  @IsNumber()
  tierId?: number;

  /**
   * @example [1, 2]
   */
  @IsOptional()
  @IsNumber({}, { each: true })
  positionIds?: number[];

  /**
   * @example true
   */
  @IsOptional()
  @IsBoolean()
  isMicUse?: boolean;

  /**
   * @example 1
   */
  @ValidateIf((_, value) => value !== undefined)
  @IsNumber()
  azitId?: number;
}

export class PartyListReqDto {
  /**
   * 커서 (다음 페이지 조회 시 이전 응답의 nextCursor 사용)
   * latest: id 숫자, mostliked: "likeCount:id" 형식
   * @example 100
   */
  @IsOptional()
  @IsString()
  cursor?: string;

  /**
   * @example 10
   */
  @IsOptional()
  @IsNumber()
  limit: number = 10;

  /**
   * @example "latest"
   */
  @IsOptional()
  @IsString()
  sort: "latest" | "mostliked" = "latest";
}
