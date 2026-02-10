// src/modules/azit/dtos/azit-schedule.res.dto.ts
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { formatDate } from '../utils/azit.util';
import { AzitScheduleRole } from '@prisma/client';
import { AzitScheduleParticipationStatus } from '../types/azit-schedule-participation-status';

export class AzitScheduleResDto {
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

  /**
   * 정적 팩토리 메서드
   */
  static from(schedule: {
    id: bigint;
    title: string;
    maxParticipants: number;
    gameStartAt: Date;
    gameEndAt: Date;
    recruitmentEndAt: Date;
  }): AzitScheduleResDto {
    return {
      schedule_id: Number(schedule.id),
      title: schedule.title,
      max_participants: schedule.maxParticipants,
      game_start_at: formatDate(schedule.gameStartAt),
      game_end_at: formatDate(schedule.gameEndAt),
      recruitment_end_at: formatDate(schedule.recruitmentEndAt),
    };
  }
}

export class AzitScheduleParticipantResDto {
  /**
   * 아지트 멤버 ID
   * @example 1
   */
  @IsNumber()
  member_id!: number;

  /**
   * 닉네임
   * @example "홍길동"
   */
  @IsString()
  nickname!: string | null;

  /**
   * 아바타 URL (착용한 아바타가 없을 경우 null)
   * @example "https://example.com/avatar.png"
   */
  @IsString()
  avatar_url!: string | null;

  /**
   * 정적 팩토리 메서드
   */
  static from(participation: {
    memberId: bigint;
    member: {
      id: bigint;
      userId: bigint;
      user: {
        id: bigint;
        nickname: string | null;
        userAvatars: {
          avatar: {
            avatarUrl: string;
          } | null;
        }[];
      };
    };
  }): AzitScheduleParticipantResDto {
    const user = participation.member.user;
    const avatarUrl = user.userAvatars?.[0]?.avatar?.avatarUrl || null;

    return {
      member_id: Number(participation.memberId),
      nickname: user.nickname,
      avatar_url: avatarUrl,
    };
  }
}

export class AzitScheduleDetailResDto extends AzitScheduleResDto {
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

  /**
   * 정적 팩토리 메서드
   */
  static fromDetail(
    schedule: {
      id: bigint;
      title: string;
      maxParticipants: number;
      gameStartAt: Date;
      gameEndAt: Date;
      recruitmentEndAt: Date;
      participations: any[];
    },
    isParticipated: boolean,
    participants: AzitScheduleParticipantResDto[],
  ): AzitScheduleDetailResDto {
    const base = AzitScheduleResDto.from(schedule);
    return {
      ...base,
      current_participants: schedule.participations.length,
      is_participated: isParticipated,
      participants: participants,
    };
  }
}

export class AzitScheduleListResDto {
  /**
   * 일정 목록
   * @example []
   */
  @IsArray()
  @IsObject({ each: true })
  schedules!: AzitScheduleDetailResDto[];

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

  /**
   * 정적 팩토리 메서드: 일정 목록 DTO 생성
   */
  static from(
    schedules: AzitScheduleDetailResDto[],
    nextCursor: string | null,
    hasNext: boolean,
  ): AzitScheduleListResDto {
    return {
      schedules,
      nextCursor,
      hasNext,
    };
  }
}

export class AzitScheduleMyParticipationResDto {
  /**
   * 참여 상태
   * @example "PENDING"
   */
  @IsString()
  is_participation!: AzitScheduleParticipationStatus;

  /**
   * 역할
   * @example "PARTICIPANT"
   */
  @IsOptional()
  @IsString()
  role!: AzitScheduleRole | null;

  /**
   * 참여 시각
   * @example "2026-02-10T00:00:00.000Z"
   */
  @IsOptional()
  @IsString()
  participation_at!: string | null;
}

export class AzitScheduleParticipantsResDto {
  /**
   * 참여자 목록
   * @example []
   */
  @IsArray()
  @IsObject({ each: true })
  participants!: AzitScheduleParticipantResDto[];
}
