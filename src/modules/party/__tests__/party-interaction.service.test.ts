import { PartyInteractionService } from '../service/party-interaction.service';
import { PartyInteractionRepository } from '../repository/party-interaction.repository';
import { PartyRepository } from '../repository/party.repository';
import { PartyErrorCode } from '../../../common/constants/error-code';
import { isSuccess } from '../../../common/types/result.type';

describe('PartyInteractionService', () => {
  let service: PartyInteractionService;
  let interactionRepo: jest.Mocked<PartyInteractionRepository>;
  let partyRepo: jest.Mocked<PartyRepository>;

  beforeEach(() => {
    // 1. Repository 모킹 초기화
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
      findPartyPostById: jest.fn(),
    } as any;

    service = new PartyInteractionService(interactionRepo, partyRepo);
    jest.clearAllMocks();
  });

  // 1. 파티 참가 신청 테스트
  describe('applyParty', () => {
    const userId = 1;
    const postId = 10;

    it('본인 파티에 신청 시 403 에러를 반환해야 한다', async () => {
      partyRepo.findPartyPostById.mockResolvedValue({ userId: BigInt(userId) } as any);
      const result = await service.applyParty(userId, postId);
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    it('중복 신청 시 409 에러를 반환해야 한다', async () => {
      partyRepo.findPartyPostById.mockResolvedValue({ userId: BigInt(99) } as any);
      interactionRepo.findApplication.mockResolvedValue({ id: BigInt(1) } as any);
      const result = await service.applyParty(userId, postId);
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(409);
    });

    // 3. 파티 참가 신청 성공 테스트
    it('모든 조건 충족 시 참가 신청에 성공하고 201을 반환해야 한다', async () => {
      // 1. 파티가 존재하고 방장은 다른 사람(99번)임
      partyRepo.findPartyPostById.mockResolvedValue({ 
        id: BigInt(postId), 
        userId: BigInt(99) 
      } as any);

      // 2. 이전에 신청한 내역이 없음
      interactionRepo.findApplication.mockResolvedValue(null);

      // 3. 레포지토리에서 신청서 생성 성공 (ID 100번 발급)
      interactionRepo.createApplication.mockResolvedValue({ 
        id: BigInt(100),
        postId: BigInt(postId),
        applicationAt: new Date()
      } as any);

      const result = await service.applyParty(userId, postId);

      // 4. 결과 검증
      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(201);
      if (isSuccess(result)) {
        expect(result.data.applicationId).toBe(100);
        expect(result.data.message).toBe("신청이 완료되었습니다.");
      }
      
      // 5. 실제로 생성 함수가 호출되었는지 확인
      expect(interactionRepo.createApplication).toHaveBeenCalledWith(userId, postId);
    });
  });

  // 2. 참가 신청 취소 테스트
  describe('cancelApplication', () => {
    const userId = 1;
    const appId = 50;

    it('타인의 신청을 취소하려 할 때 403 에러를 반환해야 한다', async () => {
      interactionRepo.findApplicationWithPost.mockResolvedValue({ userId: BigInt(99) } as any);
      const result = await service.cancelApplication(userId, appId);
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    it('본인의 신청 취소 성공 시 200을 반환해야 한다', async () => {
      interactionRepo.findApplicationWithPost.mockResolvedValue({ userId: BigInt(userId) } as any);
      const result = await service.cancelApplication(userId, appId);
      expect(isSuccess(result)).toBe(true);
      expect(interactionRepo.deleteApplication).toHaveBeenCalledWith(appId);
    });
  });

  // 3. 신청 수락/거절 테스트 (방장 권한)
  describe('handleApplication', () => {
    const leaderId = 1;
    const appId = 50;

    it('방장이 아닌 유저가 수락/거절 시 403 에러를 반환해야 한다', async () => {
      interactionRepo.findApplicationWithPost.mockResolvedValue({
        post: { userId: BigInt(99) } // 실제 방장은 99번
      } as any);
      const result = await service.handleApplication(leaderId, appId, true);
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    it('이미 승낙된 신청을 다시 승낙할 때 409 에러를 반환해야 한다', async () => {
      interactionRepo.findApplicationWithPost.mockResolvedValue({
        isAccepted: true,
        post: { userId: BigInt(leaderId) }
      } as any);
      const result = await service.handleApplication(leaderId, appId, true);
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(409);
    });

    it('방장이 승낙 성공 시 200을 반환해야 한다', async () => {
      interactionRepo.findApplicationWithPost.mockResolvedValue({
        isAccepted: false,
        post: { userId: BigInt(leaderId) }
      } as any);
      const result = await service.handleApplication(leaderId, appId, true);
      expect(isSuccess(result)).toBe(true);
      expect(interactionRepo.updateApplicationStatus).toHaveBeenCalledWith(appId, true);
    });
  });

  // 4. 좋아요 토글 테스트
  describe('toggleLike', () => {
    const userId = 1;
    const postId = 10;

    it('좋아요가 없는 상태에서 호출 시 생성 로직이 실행되어야 한다', async () => {
      partyRepo.findPartyPostById.mockResolvedValue({ id: BigInt(postId) } as any);
      interactionRepo.findLike.mockResolvedValue(null);
      const result = await service.toggleLike(userId, postId);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) expect(result.data.isLiked).toBe(true);
      expect(interactionRepo.createLike).toHaveBeenCalled();
    });

    it('좋아요가 이미 있는 상태에서 호출 시 삭제 로직이 실행되어야 한다', async () => {
      partyRepo.findPartyPostById.mockResolvedValue({ id: BigInt(postId) } as any);
      interactionRepo.findLike.mockResolvedValue({ userId: BigInt(userId) } as any);
      const result = await service.toggleLike(userId, postId);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) expect(result.data.isLiked).toBe(false);
      expect(interactionRepo.deleteLike).toHaveBeenCalled();
    });
  });
});