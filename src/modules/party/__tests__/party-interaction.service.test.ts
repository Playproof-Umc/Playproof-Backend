import { PartyInteractionService } from '../service/party-interaction.service';
import { PartyInteractionRepository } from '../repository/party-interaction.repository';
import { PartyRepository } from '../repository/party.repository';
import { isSuccess } from '../../../common/types/result.type';
import { PartyErrorCode } from '../../../common/constants/error-code';

describe('PartyInteractionService', () => {
  let service: PartyInteractionService;
  let interactionRepo: jest.Mocked<PartyInteractionRepository>;
  let partyRepo: jest.Mocked<PartyRepository>;

  beforeEach(() => {
    interactionRepo = {
      findApplication: jest.fn(),
      findApplicationWithPost: jest.fn(),
      createApplication: jest.fn(),
      updateApplicationStatus: jest.fn(),
      deleteApplication: jest.fn(),
      findLike: jest.fn(),
      createLike: jest.fn(),
      deleteLike: jest.fn(),
    } as any;

    partyRepo = {
      findPartyPostByPostId: jest.fn(),
    } as any;

    service = new PartyInteractionService(interactionRepo, partyRepo);
    jest.clearAllMocks();
  });

  // 1. 파티 참가 신청 테스트
  describe('applyParty', () => {
    const userId = 1;
    const postId = 10;

    it('존재하지 않는 파티에 신청 시 404 에러를 반환해야 한다', async () => {
      partyRepo.findPartyPostByPostId.mockResolvedValue(null);
      const result = await service.applyParty(userId, postId);
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it('본인 파티에 신청 시 403 에러를 반환해야 한다', async () => {
      partyRepo.findPartyPostByPostId.mockResolvedValue({ userId: BigInt(userId) } as any);
      const result = await service.applyParty(userId, postId);
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(403);
    });
  });

  // 2. 좋아요 토글 테스트
  describe('toggleLike', () => {
    it('좋아요가 없는 상태에서 호출 시 생성 로직이 실행되어야 한다', async () => {
      partyRepo.findPartyPostByPostId.mockResolvedValue({ id: BigInt(10) } as any);
      interactionRepo.findLike.mockResolvedValue(null);
      const result = await service.toggleLike(1, 10);
      expect(isSuccess(result)).toBe(true);
      expect(interactionRepo.createLike).toHaveBeenCalled();
    });
  });
});