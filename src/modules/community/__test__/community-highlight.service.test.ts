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
    } as any;

    service = new CommunityHighlightService(repository);
    jest.clearAllMocks();
  });

  // 2. 하이라이트 생성 테스트
  describe('createHighlight', () => {
    const userId = BigInt(1);
    const dto = { content: '하이라이트 테스트', is_public: true, medias: [] };

    it('성공: 하이라이트를 생성하고 성공 데이터를 반환한다', async () => {
      repository.createHighlight.mockResolvedValue({ id: BigInt(100) } as any);
      repository.findHighlightById.mockResolvedValue({
        id: BigInt(100), userId, content: dto.content, isPublic: dto.is_public,
        user: { nickname: '시영' }, medias: [],
        updatedAt: new Date()
      } as any);

      const result = await service.createHighlight(userId, dto as any);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.highlight_id).toBe(100);
      }
      expect(repository.createHighlight).toHaveBeenCalled();
    });
  });

  // 3. 하이라이트 목록 조회 테스트
  describe('getHighlightList', () => {
    it('성공: 공개된 하이라이트 목록과 메타 정보를 반환한다', async () => {
      repository.findCommunityHighlights.mockResolvedValue([]);
      repository.countHighlights.mockResolvedValue(5);

      const result = await service.getHighlightList(BigInt(1), 1, 10);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.meta.total_count).toBe(5);
        expect(result.data.highlights).toBeInstanceOf(Array);
      }
    });
  });

  // 4. 하이라이트 상세 조회 테스트
  describe('getHighlightDetail', () => {
    const userId = BigInt(1);
    const highlightId = BigInt(100);

    it('실패: 존재하지 않는 하이라이트인 경우 NOT_FOUND 에러를 반환한다', async () => {
      repository.findHighlightById.mockResolvedValue(null);

      const result = await service.getHighlightDetail(userId, highlightId);

      expect(result.statusCode).toBe(404);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(HighlightErrorCode.NOT_FOUND);
      }
    });

    it('실패: 비공개 글을 작성자가 아닌 유저가 조회 시 LIST_FORBIDDEN 에러를 반환한다', async () => {
      repository.findHighlightById.mockResolvedValue({
        id: highlightId, userId: BigInt(99), isPublic: false, user: { nickname: '남' }
      } as any);

      const result = await service.getHighlightDetail(userId, highlightId);

      expect(result.statusCode).toBe(403);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(HighlightErrorCode.LIST_FORBIDDEN);
      }
    });

    it('성공: 공개된 하이라이트 상세 정보를 반환한다', async () => {
      repository.findHighlightById.mockResolvedValue({
        id: highlightId, userId: BigInt(99), isPublic: true,
        user: { nickname: '유저' }, medias: [], _count: { comments: 1, likes: 2 },
        likes: [], createdAt: new Date(), updatedAt: new Date()
      } as any);

      const result = await service.getHighlightDetail(userId, highlightId);

      expect(isSuccess(result)).toBe(true);
    });
  });

  // 5. 하이라이트 수정 테스트
  describe('updateHighlight', () => {
    const userId = BigInt(1);
    const highlightId = BigInt(100);

    it('실패: 본인이 작성하지 않은 글 수정 시 UPDATE_FORBIDDEN 에러를 반환한다', async () => {
      repository.findHighlightById.mockResolvedValue({
        id: highlightId, userId: BigInt(99) // 작성자 다름
      } as any);

      const result = await service.updateHighlight(userId, highlightId, { content: '수정' });

      expect(result.statusCode).toBe(403);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(HighlightErrorCode.UPDATE_FORBIDDEN);
      }
    });

    it('성공: 본인 글인 경우 수정을 완료하고 200을 반환한다', async () => {
      repository.findHighlightById.mockResolvedValue({ id: highlightId, userId } as any);
      repository.updateHighlight.mockResolvedValue({
        id: highlightId, content: '수정됨', medias: [], isPublic: true, updatedAt: new Date()
      } as any);

      const result = await service.updateHighlight(userId, highlightId, { content: '수정됨' });

      expect(isSuccess(result)).toBe(true);
      expect(repository.updateHighlight).toHaveBeenCalled();
    });
  });

  // 6. 하이라이트 삭제 테스트
  describe('deleteHighlight', () => {
    const userId = BigInt(1);
    const highlightId = BigInt(100);

    it('성공: 작성자가 일치하면 삭제를 수행한다', async () => {
      repository.findHighlightById.mockResolvedValue({ id: highlightId, userId } as any);
      repository.deleteHighlight.mockResolvedValue({} as any);

      const result = await service.deleteHighlight(userId, highlightId);

      expect(isSuccess(result)).toBe(true);
      expect(repository.deleteHighlight).toHaveBeenCalledWith(highlightId);
    });
  });
});