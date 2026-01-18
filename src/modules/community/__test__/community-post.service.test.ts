import { CommunityPostService } from '../services/community-post.service';
import { CommunityPostRepository } from '../repositories/community-post.repository';
import { isSuccess } from '../../../common/types/result.type';

describe('CommunityPostService', () => {
  let communityPostService: CommunityPostService;
  let communityPostRepository: jest.Mocked<CommunityPostRepository>;

  beforeEach(() => {
    // 1. 레포지토리 및 내부 Prisma 속성 Mocking
    communityPostRepository = {
      findByGameId: jest.fn(),
      findBestPosts: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countByGameId: jest.fn(),
      communityPost: {
        findFirst: jest.fn(),
      },
    } as any;

    communityPostService = new CommunityPostService(communityPostRepository);
    jest.clearAllMocks();
  });

  // 2. 게시물 등록 테스트 (createPost)
  describe('createPost (게시글 등록)', () => {
    const userId = 1;
    const dto = { game_id: 1, title: '테스트', content: '내용' };

    it('실패: 유효하지 않은 게임 카테고리인 경우 404를 반환한다', async () => {
      (communityPostRepository.communityPost.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await communityPostService.createPost(userId, dto as any);
      expect(result.statusCode).toBe(404);
    });

    it('성공: 게임이 유효하면 게시글을 등록하고 201을 반환한다', async () => {
      (communityPostRepository.communityPost.findFirst as jest.Mock).mockResolvedValue({ id: BigInt(1) });
      communityPostRepository.save.mockResolvedValue({
        id: BigInt(100), userId: BigInt(1), gameId: BigInt(1), title: '테스트', content: '내용',
        user: { nickname: '시영' }, medias: [], _count: { comments: 0, likes: 0 },
        createdAt: new Date(), updatedAt: new Date()
      } as any);
      const result = await communityPostService.createPost(userId, dto as any);
      expect(result.statusCode).toBe(201);
    });
  });

  // 3. 게임별 목록 조회 테스트 (getPostList)
  describe('getPostList (게임별 목록 조회)', () => {
    it('성공: 게시글 목록과 페이징 정보를 반환한다', async () => {
      communityPostRepository.findByGameId.mockResolvedValue([]);
      communityPostRepository.countByGameId.mockResolvedValue(10);
      const result = await communityPostService.getPostList(1, 1, 10);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.meta.total_count).toBe(10);
      }
    });
  });

  // 4. 베스트 목록 조회 테스트 (getBestPostList)
  describe('getBestPostList (베스트 목록 조회)', () => {
    it('성공: 베스트 게시글 목록을 반환한다', async () => {
      communityPostRepository.findBestPosts.mockResolvedValue([]);
      const result = await communityPostService.getBestPostList(1);
      expect(isSuccess(result)).toBe(true);
      expect(communityPostRepository.findBestPosts).toHaveBeenCalledWith(1);
    });
  });

  // 5. 상세 조회 테스트 (getPostDetail)
  describe('getPostDetail (상세 조회)', () => {
    it('실패: 게시글이 없으면 404를 반환한다', async () => {
      communityPostRepository.findById.mockResolvedValue(null);
      const result = await communityPostService.getPostDetail(999);
      expect(result.statusCode).toBe(404);
    });

    it('성공: 게시글 정보를 DTO 규격에 맞춰 반환한다', async () => {
      communityPostRepository.findById.mockResolvedValue({
        id: BigInt(1), userId: BigInt(1), user: { nickname: '시영' },
        gameId: BigInt(1), title: '제목', content: '내용',
        medias: [], _count: { comments: 5, likes: 10 },
        createdAt: new Date(), updatedAt: new Date()
      } as any);
      const result = await communityPostService.getPostDetail(1);
      expect(isSuccess(result)).toBe(true);
    });
  });

  // 6. 수정 테스트 (updatePost)
  describe('updatePost (게시글 수정)', () => {
    const userId = 1;
    it('실패: 작성자가 아니면 403(Forbidden) 에러를 반환한다', async () => {
      communityPostRepository.findById.mockResolvedValue({ userId: BigInt(99) } as any);
      const result = await communityPostService.updatePost(userId, 100, { title: '수정' });
      expect(result.statusCode).toBe(403);
    });

    it('성공: 작성자가 일치하면 수정을 진행한다', async () => {
      communityPostRepository.findById.mockResolvedValue({ userId: BigInt(userId) } as any);
      communityPostRepository.update.mockResolvedValue({
        id: BigInt(100), userId: BigInt(userId), user: { nickname: '시영' },
        gameId: BigInt(1), title: '수정됨', content: '내용',
        medias: [], _count: { comments: 0, likes: 0 },
        createdAt: new Date(), updatedAt: new Date()
      } as any);
      const result = await communityPostService.updatePost(userId, 100, { title: '수정됨' });
      expect(result.statusCode).toBe(200);
    });
  });

  // 7. 삭제 테스트 (deletePost)
  describe('deletePost (게시글 삭제)', () => {
    it('성공: 본인 확인 후 게시글을 삭제한다', async () => {
      const userId = 1;
      communityPostRepository.findById.mockResolvedValue({ userId: BigInt(userId) } as any);
      const result = await communityPostService.deletePost(userId, 100);
      expect(isSuccess(result)).toBe(true);
      expect(communityPostRepository.delete).toHaveBeenCalledWith(100);
    });
  });
});