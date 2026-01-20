// src/modules/azit/dtos/azit-schedule.req.dto.ts
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Min,
  IsString,
} from 'class-validator';

export class AzitScheduleCreateReqDto {
  /**
   * 일정 제목
   * @example "증바람 5인큐"
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  title!: string;

  /**
   * 최대 모집 인원
   * @example 5
   */
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @IsNotEmpty()
  max_participants!: number;

  /**
   * 게임 시작 시간
   * @example "2026-03-01T20:00:00"
   */
  @IsDateString()
  @IsNotEmpty()
  game_start_at!: string;

  /**
   * 게임 종료 시간
   * @example "2026-03-02T00:00:00"
   */
  @IsDateString()
  @IsNotEmpty()
  game_end_at!: string;

  /**
   * 모집 마감 시간
   * @example "2026-02-28T13:00:00"
   */
  @IsDateString()
  @IsNotEmpty()
  recruitment_end_at!: string;
}

export class AzitScheduleUpdateReqDto {
  /**
   * 일정 제목
   * @example "증바람 4인큐"
   */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  title?: string | null;

  /**
   * 최대 모집 인원
   * @example 4
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  max_participants?: number | null;

  /**
   * 게임 시작 시간
   * @example "2026-03-02T20:00:00"
   */
  @IsOptional()
  @IsDateString()
  game_start_at?: string | null;

  /**
   * 게임 종료 시간
   * @example "2026-03-03T00:00:00"
   */
  @IsOptional()
  @IsDateString()
  game_end_at?: string | null;

  /**
   * 모집 마감 시간
   * @example "2026-03-01T13:00:00"
   */
  @IsOptional()
  @IsDateString()
  recruitment_end_at?: string | null;
}
