import { PartyCommentService } from '../../../modules/party/service/party-comment.service';
import { PartyCommentRepository } from '../../../modules/party/repository/party-comment.repository';
import { PartyRepository } from '../../../modules/party/repository/party.repository';
import { isSuccess } from '../../../common/types/result.type';

describe('PartyCommentService', () => {
  let service: PartyCommentService;
  let commentRepo: jest.Mocked<PartyCommentRepository>;
  let partyRepo: jest.Mocked<PartyRepository>;

  beforeEach(() => {
    // 1. Repository 모킹 초기화
    commentRepo = {
      findById: jest.fn(),
      findCommentsByPartyId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    partyRepo = {
      findPartyPostById: jest.fn(),
    } as any;

    service = new PartyCommentService(commentRepo, partyRepo);
    jest.clearAllMocks();
  });

  // 1. 댓글 목록 조회 테스트
  describe('getComments', () => {
    const partyId = 10;

    it('존재하지 않는 파티의 댓글 조회 시 404 에러를 반환해야 한다', async () => {
      partyRepo.findPartyPostById.mockResolvedValue(null);
      const result = await service.getComments(partyId, 1, 10);
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it('파티가 존재하면 댓글 목록과 메타데이터를 반환해야 한다', async () => {
      partyRepo.findPartyPostById.mockResolvedValue({ id: BigInt(partyId) } as any);
      commentRepo.findCommentsByPartyId.mockResolvedValue({
        comments: [
          { 
            id: BigInt(101), 
            userId: BigInt(50), 
            content: '테스트 댓글', 
            createdAt: new Date(), 
            replies: [] 
          }
        ],
        total: 1
      } as any);

      const result = await service.getComments(partyId, 1, 10);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.comments).toHaveLength(1);
        expect(result.data.meta.totalComments).toBe(1);
        expect(result.data.comments[0].commentId).toBe(101);
      }
    });
  });

  // 2. 댓글 작성 테스트
  describe('createComment', () => {
    const userId = 50;
    const partyId = 10;

    it('댓글 작성 성공 시 201과 작성된 데이터를 반환해야 한다', async () => {
      partyRepo.findPartyPostById.mockResolvedValue({ id: BigInt(partyId) } as any);
      commentRepo.create.mockResolvedValue({
        id: BigInt(105),
        postId: BigInt(partyId),
        userId: BigInt(userId),
        content: '새 댓글',
        createdAt: new Date(),
        parentId: null
      } as any);

      const result = await service.createComment(userId, partyId, '새 댓글');
      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(201);
      if (isSuccess(result)) {
        expect(result.data.commentId).toBe(105);
        expect(result.data.content).toBe('새 댓글');
      }
    });
  });

  // 3. 댓글 수정 테스트
  describe('updateComment', () => {
    const userId = 50;
    const commentId = 105;

    it('본인이 아닌 유저가 수정 시도 시 403 에러를 반환해야 한다', async () => {
      // 1. DB의 작성자(99번)와 요청자(50번) 불일치 케이스
      commentRepo.findById.mockResolvedValue({ id: BigInt(commentId), userId: BigInt(99) } as any);
      
      const result = await service.updateComment(userId, commentId, '수정 내용');
      
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(403);
      expect(commentRepo.update).not.toHaveBeenCalled();
    });

    it('본인이 수정 시 성공하고 200을 반환해야 한다', async () => {
      // 1. 시영님 방식의 Number() 비교가 성공하는 케이스 (50번 === 50번)
      commentRepo.findById.mockResolvedValue({ id: BigInt(commentId), userId: BigInt(userId) } as any);
      commentRepo.update.mockResolvedValue({
        id: BigInt(commentId),
        content: '수정 완료',
        updatedAt: new Date()
      } as any);

      const result = await service.updateComment(userId, commentId, '수정 완료');
      
      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(commentRepo.update).toHaveBeenCalledWith(commentId, '수정 완료');
    });
  });

  // 4. 댓글 삭제 테스트
  describe('deleteComment', () => {
    const userId = 50;
    const commentId = 105;

    it('본인이 아닌 유저가 삭제 시도 시 403 에러를 반환해야 한다', async () => {
      commentRepo.findById.mockResolvedValue({ id: BigInt(commentId), userId: BigInt(99) } as any);
      
      const result = await service.deleteComment(userId, commentId);
      
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(403);
      expect(commentRepo.delete).not.toHaveBeenCalled();
    });

    it('본인이 삭제 시 성공하고 200을 반환해야 한다', async () => {
      commentRepo.findById.mockResolvedValue({ id: BigInt(commentId), userId: BigInt(userId) } as any);
      
      const result = await service.deleteComment(userId, commentId);
      
      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(commentRepo.delete).toHaveBeenCalledWith(commentId);
    });
  });
});