import { CommunityHighlightService } from '../services/community-highlight.service';
import { CommunityHighlightRepository } from '../repositories/community-highlight.repository';
import { isSuccess } from '../../../common/types/result.type';
import { HighlightErrorCode } from '../../../common/constants/error-code';

describe('CommunityHighlightService', () => {
  let service: CommunityHighlightService;
  let repository: jest.Mocked<CommunityHighlightRepository>;

  beforeEach(() => {
    // 1. 레포지토리 Mock 초기화
    repository = {
      createHighlight: jest.fn(),
      findHighlightById: jest.fn(),
      findCommunityHighlights: jest.fn(),
      updateHighlight: jest.fn(),
      deleteHighlight: jest.fn(),
      countHighlights: jest.fn(),
      isAzitMember: jest.fn(), // 🚩 아지트 멤버 체크 메서드 추가
    } as any;

    service = new CommunityHighlightService(repository);
    jest.clearAllMocks();
  });

  // 2. 하이라이트 생성 테스트
  describe('createHighlight', () => {
    const userId = BigInt(1);
    const dto = { content: '생성 테스트', is_public: true, medias: [] };

    it('성공: 하이라이트를 생성하고 성공 데이터를 반환한다', async () => {
      repository.createHighlight.mockResolvedValue({ id: BigInt(100) } as any);
      repository.findHighlightById.mockResolvedValue({
        id: BigInt(100), userId, content: dto.content, isPublic: dto.is_public,
        user: { nickname: '시영' }, medias: [],
        updatedAt: new Date()
      } as any);

      const result = await service.createHighlight(userId, dto as any, undefined);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.highlight_id).toBe(100);
      }
    });
  });

  // 3. 하이라이트 상세 조회 테스트 (권한 로직 집중 검증)
  describe('getHighlightDetail', () => {
    const userId = BigInt(1);
    const highlightId = BigInt(100);

    it('성공: 비로그인 유저(null)여도 공개된 글(isPublic: true)은 조회 가능하다', async () => {
      repository.findHighlightById.mockResolvedValue({
        id: highlightId, userId: BigInt(99), isPublic: true, 
        user: { nickname: '유저' }, medias: [], _count: { comments: 0, likes: 0 },
        likes: [], createdAt: new Date(), updatedAt: new Date()
      } as any);

      const result = await service.getHighlightDetail(null, highlightId);

      expect(isSuccess(result)).toBe(true);
      expect(repository.isAzitMember).not.toHaveBeenCalled(); // 공개글은 아지트 체크 안 함
    });

    it('실패: 비로그인 유저가 비공개 글 조회 시 LIST_FORBIDDEN 에러를 반환한다', async () => {
      repository.findHighlightById.mockResolvedValue({
        id: highlightId, userId: BigInt(99), isPublic: false 
      } as any);

      const result = await service.getHighlightDetail(null, highlightId);

      expect(result.statusCode).toBe(403);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(HighlightErrorCode.LIST_FORBIDDEN);
      }
    });

    it('성공: 비공개 글이라도 작성자 본인이면 조회 가능하다', async () => {
      repository.findHighlightById.mockResolvedValue({
        id: highlightId, userId, isPublic: false, // 내 글 + 비공개
        user: { nickname: '시영' }, medias: [], _count: { comments: 0, likes: 0 },
        likes: [], createdAt: new Date(), updatedAt: new Date()
      } as any);

      const result = await service.getHighlightDetail(userId, highlightId);

      expect(isSuccess(result)).toBe(true);
    });

    it('성공: 로그인 유저가 좋아요한 글이면 is_liked=true를 반환한다', async () => {
      repository.findHighlightById.mockResolvedValue({
        id: highlightId, userId: BigInt(99), isPublic: true,
        user: { nickname: '유저' }, medias: [], _count: { comments: 0, likes: 1 },
        likes: [{ userId }], createdAt: new Date(), updatedAt: new Date()
      } as any);

      const result = await service.getHighlightDetail(userId, highlightId);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.is_liked).toBe(true);
      }
    });

    it('성공: 본인이 아닌 아지트 멤버가 비공개 아지트 글 조회 시 성공한다', async () => {
      const azitId = BigInt(10);
      repository.findHighlightById.mockResolvedValue({
        id: highlightId, 
        userId: BigInt(99), 
        isPublic: false, 
        azitId,
        user: { nickname: '작성자닉네임' }, 
        content: '아지트 멤버 전용 글',
        medias: [], 
        _count: { comments: 0, likes: 0 },
        likes: [], 
        createdAt: new Date(), 
        updatedAt: new Date()
      } as any);
      
      repository.isAzitMember.mockResolvedValue(true); // 아지트 멤버임

      const result = await service.getHighlightDetail(userId, highlightId);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.nickname).toBe('작성자닉네임');
      }
      expect(repository.isAzitMember).toHaveBeenCalledWith(azitId, userId);
    });

    it('실패: 아지트 멤버가 아닌 타인이 비공개 아지트 글 조회 시 실패한다', async () => {
      repository.findHighlightById.mockResolvedValue({
        id: highlightId, userId: BigInt(99), isPublic: false, azitId: BigInt(10)
      } as any);
      repository.isAzitMember.mockResolvedValue(false); // 🚩 아지트 멤버 아님

      const result = await service.getHighlightDetail(userId, highlightId);

      expect(result.statusCode).toBe(403);
    });
  });

  // 4. 하이라이트 수정 테스트
  describe('updateHighlight', () => {
    const userId = BigInt(1);
    const highlightId = BigInt(100);

    it('실패: 본인이 작성하지 않은 글 수정 시 UPDATE_FORBIDDEN 에러를 반환한다', async () => {
      repository.findHighlightById.mockResolvedValue({
        id: highlightId, userId: BigInt(99) 
      } as any);

      const result = await service.updateHighlight(userId, highlightId, { content: '수정' });

      expect(result.statusCode).toBe(403);
    });

    it('성공: 본인 글인 경우 수정을 완료하고 200을 반환한다', async () => {
      repository.findHighlightById.mockResolvedValue({ id: highlightId, userId } as any);
      repository.updateHighlight.mockResolvedValue({
        id: highlightId, content: '수정됨', medias: [], isPublic: true, updatedAt: new Date()
      } as any);

      const result = await service.updateHighlight(userId, highlightId, { content: '수정됨' });

      expect(isSuccess(result)).toBe(true);
    });
  });

  // 5. 하이라이트 삭제 테스트
  describe('deleteHighlight', () => {
    it('성공: 작성자가 일치하면 삭제를 수행한다', async () => {
      const userId = BigInt(1);
      const highlightId = BigInt(100);
      repository.findHighlightById.mockResolvedValue({ id: highlightId, userId } as any);

      const result = await service.deleteHighlight(userId, highlightId);

      expect(isSuccess(result)).toBe(true);
      expect(repository.deleteHighlight).toHaveBeenCalledWith(highlightId);
    });
  });
});