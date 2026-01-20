import { PartyCommentService } from '../service/party-comment.service';
import { PartyCommentRepository } from '../repository/party-comment.repository';
import { PartyRepository } from '../repository/party.repository';
import { isSuccess } from '../../../common/types/result.type';
import { PartyErrorCode } from '../../../common/constants/error-code';

describe('PartyCommentService', () => {
  let service: PartyCommentService;
  let commentRepo: jest.Mocked<PartyCommentRepository>;
  let partyRepo: jest.Mocked<PartyRepository>;

  beforeEach(() => {
    commentRepo = {
      findById: jest.fn(),
      findCommentsByPartyId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    partyRepo = {
      findPartyPostByPostId: jest.fn(),
    } as any;

    service = new PartyCommentService(commentRepo, partyRepo);
    jest.clearAllMocks();
  });

  // 1. 댓글 작성 테스트
  describe('createComment', () => {
    const partyId = 10;
    const userId = 1;

    it('파티가 존재하지 않으면 404 에러를 반환해야 한다', async () => {
      partyRepo.findPartyPostByPostId.mockResolvedValue(null);
      const result = await service.createComment(userId, partyId, '댓글');
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it('본인 댓글이 아닌 경우 수정 시 403 에러를 반환해야 한다', async () => {
      commentRepo.findById.mockResolvedValue({ userId: BigInt(99) } as any);
      const result = await service.updateComment(userId, 101, '수정');
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(403);
    });
  });
});