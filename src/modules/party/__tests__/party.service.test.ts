import { PartyService } from '../service/party.service';
import { PartyRepository } from '../repository/party.repository';
import { PartyErrorCode } from '../../../common/constants/error-code';
import { prisma } from '../../../common/config/database';
import { PartyCreateReqDto } from '../dtos/party.req.dto';
import { isSuccess } from '../../../common/types/result.type';

// Mock prisma
jest.mock('../../../common/config/database', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

describe('PartyService', () => {
  let partyService: PartyService;
  let partyRepository: jest.Mocked<PartyRepository>;

  beforeEach(() => {
    partyRepository = {
      findGameById: jest.fn(),
      findTierById: jest.fn(),
      findPositionsByIds: jest.fn(),
      findAzitById: jest.fn(),
      createTempAzit: jest.fn(),
      createParty: jest.fn(),
      findById: jest.fn(),
      updateParty: jest.fn(),
      updateAzit: jest.fn(),
      deleteParty: jest.fn(),
      countPartiesByAzitId: jest.fn(),
      deleteAzit: jest.fn(),
    } as any;

    partyService = new PartyService(partyRepository);
    jest.clearAllMocks();
  });

  describe('createParty', () => {
    const userId = 1;
    const validDto: PartyCreateReqDto = {
      gameId: 1,
      title: 'Test Party',
      memo: 'Test Memo',
      recruitmentPeople: 5,
      isMicUse: true,
      azitName: 'Test Azit',
      azitIconUrl: 'test-icon.png',
      positionIds: [1, 2],
      tierId: 1,
    };

    it('should return error if game not found', async () => {
      partyRepository.findGameById.mockResolvedValue(null);

      const result = await partyService.createParty(validDto, userId);

      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(404);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(PartyErrorCode.NOT_FOUND_GAME);
      }
    });

    it('should return error if tier not found', async () => {
      partyRepository.findGameById.mockResolvedValue({ id: 1 } as any);
      partyRepository.findTierById.mockResolvedValue(null);

      const result = await partyService.createParty(validDto, userId);

      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(404);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(PartyErrorCode.NOT_FOUND_TIER);
      }
    });

    it('should return error if some positions not found', async () => {
      partyRepository.findGameById.mockResolvedValue({ id: 1 } as any);
      partyRepository.findTierById.mockResolvedValue({ id: 1 } as any);
      partyRepository.findPositionsByIds.mockResolvedValue([{ id: 1 }] as any); // Only one found

      const result = await partyService.createParty(validDto, userId);

      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(404);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(PartyErrorCode.NOT_FOUND_POSITION);
      }
    });

    it('should return error if azitId is provided but azit not found', async () => {
      partyRepository.findGameById.mockResolvedValue({ id: 1 } as any);
      partyRepository.findTierById.mockResolvedValue({ id: 1 } as any);
      partyRepository.findPositionsByIds.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);
      partyRepository.findAzitById.mockResolvedValue(null);

      const result = await partyService.createParty({ ...validDto, azitId: 999 }, userId);

      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(404);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(PartyErrorCode.NOT_FOUND_AZIT);
        expect(result.error.message).toBe('아지트를 찾을 수 없습니다.');
      }
    });

    it('should return error if neither azitId nor azitName/Url are provided', async () => {
      partyRepository.findGameById.mockResolvedValue({ id: 1 } as any);
      partyRepository.findTierById.mockResolvedValue({ id: 1 } as any);
      partyRepository.findPositionsByIds.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);

      const result = await partyService.createParty({ 
        ...validDto, 
        azitId: undefined, 
        azitName: undefined, 
        azitIconUrl: undefined 
      }, userId);

      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(404);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(PartyErrorCode.NOT_FOUND_AZIT);
        expect(result.error.message).toBe('아지트 이름과 아이콘 URL이 필요합니다.');
      }
    });

    it('should successfully create a party with new azit', async () => {
      partyRepository.findGameById.mockResolvedValue({ id: 1 } as any);
      partyRepository.findTierById.mockResolvedValue({ id: 1 } as any);
      partyRepository.findPositionsByIds.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);
      
      const mockParty = {
        id: BigInt(1),
        userId: BigInt(userId),
        gameId: BigInt(1),
        title: validDto.title,
        memo: validDto.memo,
        recruitmentPeople: validDto.recruitmentPeople,
        tierId: BigInt(1),
        isMicUse: validDto.isMicUse,
        azitId: BigInt(10),
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(null);
      });

      partyRepository.createTempAzit.mockResolvedValue({ id: BigInt(10) } as any);
      partyRepository.createParty.mockResolvedValue(mockParty as any);

      const result = await partyService.createParty(validDto, userId);

      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(201);
      if (isSuccess(result)) {
        expect(result.data.partyId).toBe(1);
        expect(result.data.azitId).toBe(10);
        expect(result.data.azitName).toBe(validDto.azitName);
      }
    });
  });

  describe('getParty', () => {
    it('should return 404 if party not found', async () => {
      partyRepository.findById.mockResolvedValue(null);

      const result = await partyService.getParty(1);

      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it('should return party details if found', async () => {
      const mockParty = {
        id: BigInt(1),
        user: {
          id: BigInt(1),
          nickname: 'Host',
          trustScore: 100,
          userAvatars: [{ isEquipped: true, avatar: { avatarUrl: 'url' } }],
        },
        title: 'Title',
        memo: 'Memo',
        tier: { name: 'Gold' },
        azit: { azitName: 'Azit' },
        recruitmentPeople: 5,
        applications: [],
        isMicUse: true,
        recruitmentStatus: 'OPEN',
        viewCount: BigInt(10),
        postCategories: [{ category: { id: BigInt(1), name: 'Tag' } }],
        postPositions: [{ position: { id: BigInt(1), name: 'Pos' } }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      partyRepository.findById.mockResolvedValue(mockParty as any);

      const result = await partyService.getParty(1);

      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(200);
      if (isSuccess(result)) {
        expect(result.data.partyId).toBe(1);
        expect(result.data.host.nickname).toBe('Host');
        expect(result.data.tags).toHaveLength(1);
        expect(result.data.positions).toHaveLength(1);
      }
    });
  });

  describe('updateParty', () => {
    const partyId = 1;
    const userId = 1;
    const updateDto = {
      title: 'Updated Title',
    };

    it('should return 404 if party to update not found', async () => {
      partyRepository.findById.mockResolvedValue(null);

      const result = await partyService.updateParty(partyId, updateDto, userId);

      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it('should return 403 if non-host tries to update', async () => {
      partyRepository.findById.mockResolvedValue({ userId: BigInt(2) } as any);

      const result = await partyService.updateParty(partyId, updateDto, userId);

      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    it('should successfully update party', async () => {
      const mockParty = {
        id: BigInt(partyId),
        userId: BigInt(userId),
        azitId: BigInt(10),
        azit: { azitName: 'Old Azit', imageUrl: 'old-url' },
        postPositions: [],
      };
      partyRepository.findById.mockResolvedValueOnce(mockParty as any);
      
      const updatedParty = {
        ...mockParty,
        title: 'Updated Title',
        azit: { azitName: 'Updated Azit', imageUrl: 'updated-url' },
      };
      partyRepository.findById.mockResolvedValueOnce(updatedParty as any);
      partyRepository.updateParty.mockResolvedValue(updatedParty as any);

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(null);
      });

      const result = await partyService.updateParty(partyId, { ...updateDto, azitName: 'Updated Azit' }, userId);

      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(200);
      if (isSuccess(result)) {
        expect(result.data.title).toBe('Updated Title');
      }
    });
  });

  describe('deleteParty', () => {
    const partyId = 1;
    const userId = 1;

    it('should return 404 if party to delete not found', async () => {
      partyRepository.findById.mockResolvedValue(null);

      const result = await partyService.deleteParty(partyId, userId);

      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it('should return 403 if non-host tries to delete', async () => {
      partyRepository.findById.mockResolvedValue({ userId: BigInt(2) } as any);

      const result = await partyService.deleteParty(partyId, userId);

      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    it('should successfully delete party and its azit if no other parties', async () => {
      const azitId = 10;
      partyRepository.findById.mockResolvedValue({ userId: BigInt(userId), azitId: BigInt(azitId) } as any);
      partyRepository.countPartiesByAzitId.mockResolvedValue(0);

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(null);
      });

      const result = await partyService.deleteParty(partyId, userId);

      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(200);
      if (isSuccess(result)) {
        expect(result.data.partyId).toBe(partyId);
        expect(result.data.message).toBe("파티가 삭제되었습니다.");
        expect(result.data.deletedAt).toBeInstanceOf(Date);
      }
      expect(partyRepository.deleteParty).toHaveBeenCalledWith(partyId, null);
      expect(partyRepository.deleteAzit).toHaveBeenCalledWith(azitId, null);
    });

    it('should successfully delete party but keep azit if other parties exist', async () => {
      const azitId = 10;
      partyRepository.findById.mockResolvedValue({ userId: BigInt(userId), azitId: BigInt(azitId) } as any);
      partyRepository.countPartiesByAzitId.mockResolvedValue(1);

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(null);
      });

      const result = await partyService.deleteParty(partyId, userId);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.partyId).toBe(partyId);
      }
      expect(partyRepository.deleteParty).toHaveBeenCalledWith(partyId, null);
      expect(partyRepository.deleteAzit).not.toHaveBeenCalled();
    });
  });
});
