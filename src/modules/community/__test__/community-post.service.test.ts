import { CommunityPostService } from '../services/community-post.service';
import { CommunityPostRepository } from '../repositories/community-post.repository';
import { isSuccess } from '../../../common/types/result.type';
import { CommunityErrorCode } from '../../../common/constants/error-code';

describe('CommunityPostService', () => {
  let communityPostService: CommunityPostService;
  let communityPostRepository: jest.Mocked<CommunityPostRepository>;

  beforeEach(() => {
    // 1. 레포지토리 Mock 초기화
    communityPostRepository = {
      findByGameId: jest.fn(),
      findAll: jest.fn(),
      findBestPosts: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countByGameId: jest.fn(),
      countAll: jest.fn(),
      findGameById: jest.fn(),
    } as any;

    communityPostService = new CommunityPostService(communityPostRepository);
    jest.clearAllMocks();
  });

  // 2. 게시글 등록 테스트
  describe('createPost', () => {
    const userId = 1;
    const dto = { game_id: 1, title: '테스트 제목', content: '테스트 내용' };

    it('실패: 존재하지 않는 게임 카테고리인 경우 GAME_NOT_FOUND 에러를 반환한다', async () => {
      communityPostRepository.findGameById.mockResolvedValue(null);

      const result = await communityPostService.createPost(userId, dto as any, undefined);

      expect(result.statusCode).toBe(404);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(CommunityErrorCode.GAME_NOT_FOUND);
      }
    });

    it('성공: 게임이 존재하면 게시글을 생성하고 201을 반환한다', async () => {
      communityPostRepository.findGameById.mockResolvedValue({ id: BigInt(1) } as any);
      communityPostRepository.save.mockResolvedValue({
        id: BigInt(100), userId: BigInt(userId), gameId: BigInt(1),
        title: dto.title, user: { nickname: '시영' }, medias: [],
        _count: { comments: 0, likes: 0 },
        createdAt: new Date(), updatedAt: new Date()
      } as any);

      const result = await communityPostService.createPost(userId, dto as any, undefined);

      expect(result.statusCode).toBe(201);
      expect(isSuccess(result)).toBe(true);
    });
  });

  // 3. 게임별 목록 조회 테스트
  describe('getPostList', () => {
    it('성공: 페이징된 게시글 목록과 메타 정보를 반환한다', async () => {
      communityPostRepository.findByGameId.mockResolvedValue([]);
      communityPostRepository.countByGameId.mockResolvedValue(10);

      const result = await communityPostService.getPostList(1, 1, 10);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.meta.total_count).toBe(10);
        expect(result.data.meta.total_pages).toBe(1);
      }
    });
  });

  // 3-1. 전체 목록 조회 테스트
  describe('getAllPostList', () => {
    it('성공: 페이징된 전체 게시글 목록과 메타 정보를 반환한다', async () => {
      communityPostRepository.findAll.mockResolvedValue([]);
      communityPostRepository.countAll.mockResolvedValue(15);

      const result = await communityPostService.getAllPostList(1, 10);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.meta.total_count).toBe(15);
        expect(result.data.meta.total_pages).toBe(2);
      }
    });

    it('실패: 페이지 파라미터가 유효하지 않으면 400을 반환한다', async () => {
      const result = await communityPostService.getAllPostList(0, 10);

      expect(result.statusCode).toBe(400);
      expect(isSuccess(result)).toBe(false);
    });
  });

  // 4. 베스트 게시글 조회 테스트
  describe('getBestPostList', () => {
    it('성공: 좋아요 순으로 정렬된 베스트 게시글 목록을 반환한다', async () => {
      communityPostRepository.findBestPosts.mockResolvedValue([]);

      const result = await communityPostService.getBestPostList(1);

      expect(isSuccess(result)).toBe(true);
      expect(communityPostRepository.findBestPosts).toHaveBeenCalledWith(1);
    });
  });

  // 5. 게시글 상세 조회 테스트
  describe('getPostDetail', () => {
    it('실패: 게시글이 존재하지 않으면 POST_NOT_FOUND 에러를 반환한다', async () => {
      communityPostRepository.findById.mockResolvedValue(null);

      const result = await communityPostService.getPostDetail(999);

      expect(result.statusCode).toBe(404);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(CommunityErrorCode.POST_NOT_FOUND);
      }
    });

    it('성공: 존재하는 게시글인 경우 상세 정보를 포맷팅하여 반환한다', async () => {
      communityPostRepository.findById.mockResolvedValue({
        id: BigInt(1), userId: BigInt(1), user: { nickname: '시영' },
        gameId: BigInt(1), title: '제목', content: '내용',
        medias: [], _count: { comments: 5, likes: 10 },
        createdAt: new Date(), updatedAt: new Date()
      } as any);

      const result = await communityPostService.getPostDetail(1);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.post_id).toBe(1);
        expect(result.data.like_count).toBe(10);
      }
    });
  });

  // 6. 게시글 수정 테스트
  describe('updatePost', () => {
    const userId = 1;
    const postId = 100;

    it('실패: 수정 권한이 없는 경우(작성자 불일치) FORBIDDEN 에러를 반환한다', async () => {
      communityPostRepository.findById.mockResolvedValue({ userId: BigInt(99) } as any);

      const result = await communityPostService.updatePost(userId, postId, { title: '수정' });

      expect(result.statusCode).toBe(403);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(CommunityErrorCode.FORBIDDEN);
      }
    });

    it('성공: 작성자가 일치하면 게시글을 수정하고 200을 반환한다', async () => {
      communityPostRepository.findById.mockResolvedValue({ userId: BigInt(userId) } as any);
      communityPostRepository.update.mockResolvedValue({
        id: BigInt(postId), userId: BigInt(userId), user: { nickname: '시영' },
        gameId: BigInt(1), title: '수정됨', content: '내용',
        medias: [], _count: { comments: 0, likes: 0 },
        createdAt: new Date(), updatedAt: new Date()
      } as any);

      const result = await communityPostService.updatePost(userId, postId, { title: '수정됨' });

      expect(result.statusCode).toBe(200);
      expect(isSuccess(result)).toBe(true);
    });
  });

  // 7. 게시글 삭제 테스트
  describe('deletePost', () => {
    const userId = 1;
    const postId = 100;

    it('실패: 삭제하려는 게시글이 없는 경우 POST_NOT_FOUND 를 반환한다', async () => {
      communityPostRepository.findById.mockResolvedValue(null);

      const result = await communityPostService.deletePost(userId, postId);

      expect(result.statusCode).toBe(404);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(CommunityErrorCode.POST_NOT_FOUND);
      }
    });

    it('성공: 본인 글인 경우 삭제를 완료하고 성공 메시지를 반환한다', async () => {
      communityPostRepository.findById.mockResolvedValue({ userId: BigInt(userId) } as any);

      const result = await communityPostService.deletePost(userId, postId);

      expect(isSuccess(result)).toBe(true);
      expect(communityPostRepository.delete).toHaveBeenCalledWith(postId);
    });
  });
});