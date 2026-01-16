// src/modules/azit/dtos/azit-schedule.res.dto.ts
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsString,
} from 'class-validator';

export class AzitScheduleCreateResDto {
  /**
   * 일정 ID
   * @example 1
   */
  schedule_id!: number;

  /**
   * 일정 제목
   * @example "증바람 5인큐"
   */
  title!: string;

  /**
   * 최대 모집 인원
   * @example 5
   */
  max_participants!: number;

  /**
   * 게임 시작 시간
   * @example "2026-03-01T20:00:00"
   */
  game_start_at!: string;

  /**
   * 게임 종료 시간
   * @example "2026-03-02T00:00:00"
   */
  game_end_at!: string;

  /**
   * 모집 마감 시간
   * @example "2026-02-28T13:00:00"
   */
  recruitment_end_at!: string;
}

export class AzitScheduleParticipantResDto {
  /**
   * 사용자 ID
   * @example 1
   */
  @IsNumber()
  user_id!: number;

  /**
   * 닉네임
   * @example "홍길동"
   */
  @IsString()
  nickname!: string | null;

  /**
   * 아바타 URL
   * @example "https://example.com/avatar.png"
   */
  @IsString()
  avatar_url!: string | null;
}

export class AzitScheduleItemResDto extends AzitScheduleCreateResDto {
  /**
   * 현재 참여 인원 수
   * @example 3
   */
  @IsNumber()
  current_participants!: number;

  /**
   * 현재 사용자의 참여 여부
   * @example true
   */
  @IsBoolean()
  is_participated!: boolean;

  /**
   * 참여자 목록
   * @example []
   */
  @IsArray()
  @IsObject({ each: true })
  participants!: AzitScheduleParticipantResDto[];
}

export class AzitScheduleListResDto {
  /**
   * 일정 목록
   * @example []
   */
  @IsArray()
  @IsObject({ each: true })
  schedules!: AzitScheduleItemResDto[];

  /**
   * 형식: `${game_start_at}|${schedule_id}`
   * 마지막 페이지인 경우 null
   * @example "2026-03-01T20:00:00|1"
   */
  @IsString()
  nextCursor!: string | null;

  /**
   * 다음 페이지 존재 여부
   * @example true
   */
  @IsBoolean()
  hasNext!: boolean;
}
