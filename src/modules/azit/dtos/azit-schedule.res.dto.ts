// src/modules/azit/dtos/azit-schedule.res.dto.ts
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
