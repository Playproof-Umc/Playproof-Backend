import { IsBoolean, IsNumber, IsString } from "class-validator";

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
   * @example [1, 2]
   */
  @IsNumber({}, { each: true })
  positionIds!: number[];

  /**
   * @example true
   */
  @IsBoolean()
  isMicUse!: boolean;

  /**
   * @example "아지트 이름"
   */
  @IsString()
  azitName!: string;

  /**
   * @example "아지트 아이콘 URL"
   */
  @IsString()
  azitIconUrl!: string;
}