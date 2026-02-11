import { AzitScheduleParticipationService } from '../services/azit-schedule-participation.service';
import { AzitRepository } from '../repositories/azit.repository';
import { AzitScheduleRepository } from '../repositories/azit-schedule.repository';
import { AzitUserRepository } from '../repositories/azit-user.repository';
import { AzitScheduleParticipationRepository } from '../repositories/azit-schedule-participation.repository';
import { AzitScheduleRole } from '@prisma/client';
import { AzitScheduleParticipationStatus } from '../types/azit-schedule-participation-status';
import { isSuccess } from '../../../common/types/result.type';

describe('AzitScheduleParticipationService', () => {
  let service: AzitScheduleParticipationService;
  let azitRepository: jest.Mocked<AzitRepository>;
  let azitScheduleRepository: jest.Mocked<AzitScheduleRepository>;
  let azitUserRepository: jest.Mocked<AzitUserRepository>;
  let azitScheduleParticipationRepository: jest.Mocked<AzitScheduleParticipationRepository>;

  const userId = BigInt(1);
  const azitId = BigInt(2);
  const scheduleId = BigInt(3);
  const memberId = BigInt(10);

  const schedule = {
    id: scheduleId,
    azitId,
    maxParticipants: 5,
    recruitmentEndAt: new Date(Date.now() + 60 * 60 * 1000),
    gameStartAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    gameEndAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
  } as any;

  beforeEach(() => {
    azitRepository = {
      findAzitById: jest.fn().mockResolvedValue({ id: azitId } as any),
    } as any;

    azitScheduleRepository = {
      findScheduleById: jest.fn().mockResolvedValue(schedule),
    } as any;

    azitUserRepository = {
      findAzitUserByUserIdAndAzitId: jest.fn().mockResolvedValue({
        id: memberId,
      } as any),
    } as any;

    azitScheduleParticipationRepository = {
      countParticipations: jest.fn().mockResolvedValue(0),
      existsParticipation: jest.fn().mockResolvedValue(false),
      findParticipation: jest.fn().mockResolvedValue(null),
      updateParticipationStatus: jest.fn().mockResolvedValue(null),
      createParticipation: jest.fn().mockResolvedValue(null),
      findParticipantsByStatus: jest.fn().mockResolvedValue([]),
    } as any;

    service = new AzitScheduleParticipationService(
      azitRepository,
      azitScheduleRepository,
      azitUserRepository,
      azitScheduleParticipationRepository,
    );

    jest.clearAllMocks();
  });

  describe('updateParticipationStatus', () => {
    it('참여 기록이 없으면 새로 생성해야 한다', async () => {
      const result = await service.updateParticipationStatus(
        userId,
        azitId,
        scheduleId,
        AzitScheduleParticipationStatus.JOIN,
      );

      expect(isSuccess(result)).toBe(true);
      expect(azitScheduleParticipationRepository.createParticipation).toHaveBeenCalledWith(
        memberId,
        scheduleId,
        AzitScheduleRole.PARTICIPANT,
        AzitScheduleParticipationStatus.JOIN,
      );
    });

    it('참여 기록이 있으면 상태를 갱신해야 한다', async () => {
      azitScheduleParticipationRepository.findParticipation.mockResolvedValue({
        memberId,
        scheduleId,
      } as any);

      const result = await service.updateParticipationStatus(
        userId,
        azitId,
        scheduleId,
        AzitScheduleParticipationStatus.DECLINE,
      );

      expect(isSuccess(result)).toBe(true);
      expect(azitScheduleParticipationRepository.updateParticipationStatus).toHaveBeenCalledWith(
        memberId,
        scheduleId,
        AzitScheduleParticipationStatus.DECLINE,
      );
    });
  });

  describe('getMyParticipationStatus', () => {
    it('참여 기록이 없으면 PENDING 상태를 반환해야 한다', async () => {
      azitScheduleParticipationRepository.findParticipation.mockResolvedValue(null);

      const result = await service.getMyParticipationStatus(
        userId,
        azitId,
        scheduleId,
      );

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.is_participation).toBe(
          AzitScheduleParticipationStatus.PENDING,
        );
        expect(result.data.role).toBeNull();
        expect(result.data.participation_at).toBeNull();
      }
    });
  });

  describe('getParticipantsByStatus', () => {
    it('상태별 참여자 목록을 반환해야 한다', async () => {
      azitScheduleParticipationRepository.findParticipantsByStatus.mockResolvedValue([
        {
          memberId,
          member: {
            id: memberId,
            userId,
            user: {
              id: userId,
              nickname: '테스트유저',
              userAvatars: [
                {
                  avatar: {
                    avatarUrl: 'https://example.com/avatar.png',
                  },
                },
              ],
            },
          },
        },
      ] as any);

      const result = await service.getParticipantsByStatus(
        userId,
        azitId,
        scheduleId,
        AzitScheduleParticipationStatus.JOIN,
      );

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.participants).toHaveLength(1);
        expect(result.data.participants[0].member_id).toBe(Number(memberId));
        expect(result.data.participants[0].nickname).toBe('테스트유저');
        expect(result.data.participants[0].avatar_url).toBe(
          'https://example.com/avatar.png',
        );
      }
    });
  });
});
