import { HighlightListService } from '../services/highlight-list.service';
import { HighlightRepository } from '../repositories/highlight.repository';
import { AzitRepository } from '../../azit/repositories/azit.repository';
import { AzitUserRepository } from '../../azit/repositories/azit-user.repository';
import { isSuccess } from '../../../common/types/result.type';

describe('HighlightListService', () => {
  let highlightListService: HighlightListService;
  let highlightRepository: jest.Mocked<HighlightRepository>;
  let azitRepository: jest.Mocked<AzitRepository>;
  let azitUserRepository: jest.Mocked<AzitUserRepository>;

  beforeEach(() => {
    highlightRepository = {
      findHighlightsByUserId: jest.fn(),
      findUserLikesByHighlightIds: jest.fn(),
      findHighlightsByAzitId: jest.fn(),
      findCommunityHighlights: jest.fn(),
      findHighlightById: jest.fn(),
    } as any;

    azitRepository = {
      findAzitById: jest.fn(),
    } as any;

    azitUserRepository = {
      findAzitUserByUserIdAndAzitId: jest.fn(),
    } as any;

    highlightListService = new HighlightListService(
      highlightRepository,
      azitRepository,
      azitUserRepository,
    );
    jest.clearAllMocks();
  });

  describe('getMyHighlightList', () => {
    const userId = BigInt(1);
    const mockHighlight = {
      id: BigInt(100),
      userId,
      content: '테스트 하이라이트',
      isPublic: true,
      azitId: BigInt(10),
      user: { id: userId, nickname: '테스트유저' },
      azit: { id: BigInt(10), azitName: '테스트 아지트' },
      medias: [
        { id: BigInt(1), mediaUrl: 'https://example.com/video.mp4', order: 0, uploadAt: new Date() },
      ],
      _count: { likes: 5, comments: 2 },
    };

    it('성공: 내가 쓴 하이라이트 목록을 반환한다 (아지트 하이라이트)', async () => {
      highlightRepository.findHighlightsByUserId.mockResolvedValue([mockHighlight] as any);
      highlightRepository.findUserLikesByHighlightIds.mockResolvedValue([]);

      const result = await highlightListService.getMyHighlightList(userId, null, 20);

      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(highlightRepository.findHighlightsByUserId).toHaveBeenCalledWith(userId, null, 20);
      if (isSuccess(result)) {
        expect(result.data.highlights).toHaveLength(1);
        expect(result.data.highlights[0].highlight_id).toBe(100);
        expect(result.data.highlights[0].content).toBe('테스트 하이라이트');
        expect(result.data.highlights[0].azit_id).toBe(10);
        expect(result.data.highlights[0].azit_name).toBe('테스트 아지트');
        expect(result.data.highlights[0].visibility).toBe('PUBLIC');
        expect(result.data.has_next).toBe(false);
      }
    });

    it('성공: 커뮤니티 직접 등록 하이라이트는 azit_id가 null이다', async () => {
      const communityHighlight = {
        ...mockHighlight,
        id: BigInt(101),
        azitId: null,
        azit: null,
      };
      highlightRepository.findHighlightsByUserId.mockResolvedValue([communityHighlight] as any);
      highlightRepository.findUserLikesByHighlightIds.mockResolvedValue([]);

      const result = await highlightListService.getMyHighlightList(userId, null, 20);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.highlights[0].azit_id).toBeNull();
        expect(result.data.highlights[0].azit_name).toBeNull();
      }
    });

    it('성공: 다음 페이지가 있으면 has_next가 true이다', async () => {
      const manyHighlights = Array(21).fill(mockHighlight).map((h, i) => ({
        ...h,
        id: BigInt(100 + i),
      }));
      highlightRepository.findHighlightsByUserId.mockResolvedValue(manyHighlights as any);
      highlightRepository.findUserLikesByHighlightIds.mockResolvedValue([]);

      const result = await highlightListService.getMyHighlightList(userId, null, 20);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.highlights).toHaveLength(20);
        expect(result.data.has_next).toBe(true);
        expect(result.data.next_cursor).toBe(119); // 100 + 19
      }
    });

    it('성공: 커서 기반 페이지네이션이 동작한다', async () => {
      highlightRepository.findHighlightsByUserId.mockResolvedValue([mockHighlight] as any);
      highlightRepository.findUserLikesByHighlightIds.mockResolvedValue([]);

      const result = await highlightListService.getMyHighlightList(userId, BigInt(200), 20);

      expect(highlightRepository.findHighlightsByUserId).toHaveBeenCalledWith(
        userId,
        BigInt(200),
        20,
      );
      expect(isSuccess(result)).toBe(true);
    });

    it('성공: 작성한 하이라이트가 없으면 빈 배열을 반환한다', async () => {
      highlightRepository.findHighlightsByUserId.mockResolvedValue([] as any);
      highlightRepository.findUserLikesByHighlightIds.mockResolvedValue([]);

      const result = await highlightListService.getMyHighlightList(userId, null, 20);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.highlights).toHaveLength(0);
        expect(result.data.has_next).toBe(false);
        expect(result.data.next_cursor).toBeNull();
      }
    });

    it('성공: 좋아요한 하이라이트는 is_liked가 true이다', async () => {
      highlightRepository.findHighlightsByUserId.mockResolvedValue([mockHighlight] as any);
      highlightRepository.findUserLikesByHighlightIds.mockResolvedValue([
        { highlightId: BigInt(100) },
      ]);

      const result = await highlightListService.getMyHighlightList(userId, null, 20);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.highlights[0].is_liked).toBe(true);
      }
    });

    it('성공: limit 미지정 시 기본값 20을 사용한다', async () => {
      highlightRepository.findHighlightsByUserId.mockResolvedValue([] as any);
      highlightRepository.findUserLikesByHighlightIds.mockResolvedValue([]);

      await highlightListService.getMyHighlightList(userId, null, undefined as any);

      expect(highlightRepository.findHighlightsByUserId).toHaveBeenCalledWith(
        userId,
        null,
        20,
      );
    });
  });
});
