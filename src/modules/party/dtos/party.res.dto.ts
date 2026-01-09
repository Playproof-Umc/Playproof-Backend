import { IsBoolean, IsNumber, IsString } from "class-validator";

export class PartyGetResDto {}

export class PartyCreateResDto {
  /**
   * @example 1
   */
  @IsNumber()
  partyId!: number;
  /**
   * @example 1
   */
  @IsNumber()
  userId!: number | null;
  /**
   * @example 1
   */
  @IsNumber()
  gameId!: number | null;
  /**
   * @example 1
   */
  @IsString()
  title!: string | null;
  /**
   * @example 1
   */
  @IsString()
  memo!: string | null;
  /**
   * @example 1
   */
  @IsNumber()
  recruitmentPeople!: number | null;
  /**
   * @example 1
   */
  @IsNumber()
  tierId!: number | null;
  /**
   * @example 1
   */
  @IsNumber()
  positionId!: number | null;
  /**
   * @example true
   */
  @IsBoolean()
  isMicUse!: boolean | null;
  /**
   * @example 1
   */
  @IsNumber()
  azitId!: number | null;
  /**
   * @example 1
   */
  @IsString()
  azitName!: string | null;
  /**
   * @example "https://example.com/azit.png"
   */
  @IsString()
  azitIconUrl!: string | null;
}