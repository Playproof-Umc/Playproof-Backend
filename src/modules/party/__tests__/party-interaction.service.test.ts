import { PartyInteractionService } from '../service/party-interaction.service';
import { PartyInteractionRepository } from '../repository/party-interaction.repository';
import { PartyRepository } from '../repository/party.repository';
import { isSuccess } from '../../../common/types/result.type';

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
      findPartyPostById: jest.fn(),
      findPositionsByIds: jest.fn(),
      findGameById: jest.fn(),
      findTierById: jest.fn(),
      findAzitById: jest.fn(),
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

    it('모든 조건 충족 시 참가 신청에 성공하고 201을 반환해야 한다', async () => {
      // 1. 파티 정보 및 이전 신청 내역 없음 설정
      partyRepo.findPartyPostById.mockResolvedValue({ id: BigInt(postId), userId: BigInt(99) } as any);
      interactionRepo.findApplication.mockResolvedValue(null);

      // 2. 생성 결과에 createdAt을 포함하여 toISOString 에러 방지
      interactionRepo.createApplication.mockResolvedValue({ 
        id: BigInt(100),
        createdAt: new Date() 
      } as any);

      const result = await service.applyParty(userId, postId);

      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(201);
      if (isSuccess(result)) {
        expect(result.data.applicationId).toBe(100);
      }
    });
  });

  // 2. 참가 신청 취소 테스트
  describe('cancelApplication', () => {
    const userId = 1;
    const appId = 50;

    it('타인의 신청을 취소하려 할 때 403 에러를 반환해야 한다', async () => {
      // 1. 신청자 ID가 요청 유저와 다름을 시뮬레이션
      interactionRepo.findApplicationWithPost.mockResolvedValue({ userId: BigInt(99) } as any);
      const result = await service.cancelApplication(userId, appId);
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    it('본인의 신청 취소 성공 시 200을 반환해야 한다', async () => {
      // 2. 신청자 ID 일치 및 삭제 로직 검증
      interactionRepo.findApplicationWithPost.mockResolvedValue({ userId: BigInt(userId) } as any);
      const result = await service.cancelApplication(userId, appId);
      expect(isSuccess(result)).toBe(true);
      expect(interactionRepo.deleteApplication).toHaveBeenCalledWith(appId);
    });
  });

  // 3. 신청 수락/거절 테스트
  describe('handleApplication', () => {
    const leaderId = 1;
    const appId = 50;

    it('이미 승낙된 신청을 다시 승낙할 때 409 에러를 반환해야 한다', async () => {
      // 1. 이미 수락된 상태(isAccepted: true) 설정
      interactionRepo.findApplicationWithPost.mockResolvedValue({
        id: BigInt(appId),
        isAccepted: true,
        post: { userId: BigInt(leaderId) }
      } as any);
      const result = await service.handleApplication(leaderId, appId, true);
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(409);
    });

    it('방장이 승낙 성공 시 200을 반환해야 한다', async () => {
      // 2. 업데이트 결과에 id, postId, updatedAt을 포함하여 undefined 에러 방지
      interactionRepo.findApplicationWithPost.mockResolvedValue({
        isAccepted: false,
        post: { userId: BigInt(leaderId) }
      } as any);

      interactionRepo.updateApplicationStatus.mockResolvedValue({
        id: BigInt(appId),
        postId: BigInt(10),
        isAccepted: true,
        updatedAt: new Date()
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
      // 1. 좋아요 미존재 상태에서 생성 호출 검증
      partyRepo.findPartyPostById.mockResolvedValue({ id: BigInt(postId) } as any);
      interactionRepo.findLike.mockResolvedValue(null);
      const result = await service.toggleLike(userId, postId);
      expect(isSuccess(result)).toBe(true);
      expect(interactionRepo.createLike).toHaveBeenCalled();
    });

    it('좋아요가 이미 있는 상태에서 호출 시 삭제 로직이 실행되어야 한다', async () => {
      // 2. 좋아요 존재 상태에서 삭제 호출 검증
      partyRepo.findPartyPostById.mockResolvedValue({ id: BigInt(postId) } as any);
      interactionRepo.findLike.mockResolvedValue({ userId: BigInt(userId) } as any);
      const result = await service.toggleLike(userId, postId);
      expect(isSuccess(result)).toBe(true);
      expect(interactionRepo.deleteLike).toHaveBeenCalled();
    });
  });
});