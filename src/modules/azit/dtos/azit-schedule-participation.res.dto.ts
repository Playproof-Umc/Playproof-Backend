// src/modules/azit/dtos/azit-schedule-participation.res.dto.ts
import { IsBoolean } from 'class-validator';

export class AzitScheduleParticipationResDto {
  /**
   * 참여 성공 여부
   * @example true
   */
  @IsBoolean()
  success!: boolean;
}
