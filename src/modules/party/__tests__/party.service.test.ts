import { PartyService } from '../service/party.service';
import { PartyRepository } from '../repository/party.repository';
import { PartyErrorCode } from '../../../common/constants/error-code';
import { prisma } from '../../../common/config/database';
import { PartyCreateReqDto } from '../dtos/party.req.dto';
import { isSuccess } from '../../../common/types/result.type';

jest.mock('../../../common/config/database', () => ({
  prisma: { $transaction: jest.fn() },
}));

describe('PartyService', () => {
  let partyService: PartyService;
  let partyRepository: jest.Mocked<PartyRepository>;

  beforeEach(() => {
    partyRepository = {
      findPartyPostByPostId: jest.fn(),
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
      findParties: jest.fn(),
      countAll: jest.fn(),
    } as any;

    partyService = new PartyService(partyRepository);
    jest.clearAllMocks();
  });

  // 1. 파티 생성 테스트
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

    it('게임을 찾을 수 없으면 404 에러를 반환해야 한다', async () => {
      partyRepository.findGameById.mockResolvedValue(null);
      const result = await partyService.createParty(validDto, userId);
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(404);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(PartyErrorCode.NOT_FOUND_GAME);
      }
    });

    it('성공적으로 파티를 생성하고 201을 반환해야 한다', async () => {
      partyRepository.findGameById.mockResolvedValue({ id: 1 } as any);
      partyRepository.findTierById.mockResolvedValue({ id: 1 } as any);
      partyRepository.findPositionsByIds.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);
      
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(null));
      partyRepository.createTempAzit.mockResolvedValue({ id: BigInt(10) } as any);
      partyRepository.createParty.mockResolvedValue({ id: BigInt(1), userId: BigInt(userId), azitId: BigInt(10) } as any);

      const result = await partyService.createParty(validDto, userId);
      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(201);
    });
  });

  // 2. 파티 수정 테스트
  describe('updateParty', () => {
    const partyId = 1;
    const userId = 1;

    it('방장이 아닌 유저가 수정 시 403 에러를 반환해야 한다', async () => {
      partyRepository.findPartyPostByPostId.mockResolvedValue({ userId: BigInt(99) } as any);
      const result = await partyService.updateParty(partyId, { title: '수정' }, userId);
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(403);
    });
  });
});