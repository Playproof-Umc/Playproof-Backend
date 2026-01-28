import { CommunityInteractionService } from '../services/community-interaction.service';
import { CommunityLikeRepository } from '../repositories/community-like.repository';
import { CommunityCommentRepository } from '../repositories/community-comment.repository';
import { CommunityInteractionValidator } from '../utils/community-interaction.validator';
import { CommunityTargetType } from '../types/community-type';
import { isSuccess } from '../../../common/types/result.type';
import { CommunityErrorCode } from '../../../common/constants/error-code';

describe('CommunityInteractionService', () => {
  let service: CommunityInteractionService;
  let likeRepository: jest.Mocked<CommunityLikeRepository>;
  let commentRepository: jest.Mocked<CommunityCommentRepository>;
  let validator: jest.Mocked<CommunityInteractionValidator>;

  beforeEach(() => {
    // 1. Mock 초기화
    likeRepository = {
      findLike: jest.fn(),
      createLike: jest.fn(),
      deleteLike: jest.fn(),
      countLikes: jest.fn(),
    } as any;

    commentRepository = {
      findCommentById: jest.fn(),
      createComment: jest.fn(),
      findCommentsByTarget: jest.fn(),
      updateComment: jest.fn(),
      deleteComment: jest.fn(),
    } as any;

    validator = {
      validateTargetResource: jest.fn(),
      validateCommentOwner: jest.fn(),
      validateParentComment: jest.fn(),
    } as any;

    service = new CommunityInteractionService(likeRepository, commentRepository, validator);
    jest.clearAllMocks();
  });

  // 2. 좋아요 토글 테스트
  describe('toggleLike', () => {
    const userId = BigInt(1);
    const dto = { target_type: CommunityTargetType.POST, target_id: 100 };

    it('실패: 대상 리소스가 존재하지 않으면 validator의 에러를 반환한다', async () => {
      validator.validateTargetResource.mockResolvedValue({
        statusCode: 404,
        error: { code: CommunityErrorCode.POST_NOT_FOUND, message: 'Not Found' },
        data: null
      } as any);

      const result = await service.toggleLike(userId, dto);

      expect(result.statusCode).toBe(404);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(CommunityErrorCode.POST_NOT_FOUND);
      }
    });

    it('성공: 이미 좋아요가 있다면 삭제(취소)하고 is_liked: false를 반환한다', async () => {
      validator.validateTargetResource.mockResolvedValue({ data: {} } as any);
      likeRepository.findLike.mockResolvedValue({ id: BigInt(1) } as any);
      likeRepository.countLikes.mockResolvedValue(9);

      const result = await service.toggleLike(userId, dto);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.is_liked).toBe(false);
        expect(result.data.like_count).toBe(9);
      }
      expect(likeRepository.deleteLike).toHaveBeenCalled();
    });

    it('성공: 좋아요가 없다면 생성하고 is_liked: true를 반환한다', async () => {
      validator.validateTargetResource.mockResolvedValue({ data: {} } as any);
      likeRepository.findLike.mockResolvedValue(null);
      likeRepository.countLikes.mockResolvedValue(11);

      const result = await service.toggleLike(userId, dto);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.is_liked).toBe(true);
        expect(result.data.like_count).toBe(11);
      }
      expect(likeRepository.createLike).toHaveBeenCalled();
    });
  });

  // 3. 댓글 작성 테스트
  describe('createComment', () => {
    const userId = BigInt(1);
    const dto = { target_type: CommunityTargetType.POST, target_id: 100, content: '댓글내용' };

    it('성공: 부모 댓글이 없는 일반 댓글을 생성한다', async () => {
      validator.validateTargetResource.mockResolvedValue({ data: {} } as any);
      commentRepository.createComment.mockResolvedValue({
        id: BigInt(1), parentId: null, userId: userId, content: dto.content,
        user: { nickname: '시영' }, createdAt: new Date()
      } as any);

      const result = await service.createComment(userId, dto);

      expect(result.statusCode).toBe(201);
      if (isSuccess(result)) {
        expect(result.data.parent_id).toBeNull();
        expect(result.data.nickname).toBe('시영');
      }
    });

    it('실패: 존재하지 않는 부모 댓글에 답글을 달려고 하면 에러를 반환한다', async () => {
      const replyDto = { ...dto, parent_id: 999 };
      validator.validateTargetResource.mockResolvedValue({ data: {} } as any);
      validator.validateParentComment.mockResolvedValue({
        statusCode: 404,
        error: { code: CommunityErrorCode.COMMENT_NOT_FOUND, message: 'Not Found' },
        data: null
      } as any);

      const result = await service.createComment(userId, replyDto);

      expect(result.statusCode).toBe(404);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(CommunityErrorCode.COMMENT_NOT_FOUND);
      }
    });
  });

  // 4. 댓글 수정 테스트
  describe('updateComment', () => {
    const userId = BigInt(1);
    const commentId = 50;

    it('실패: 본인 댓글이 아니면 validator에서 반환한 FORBIDDEN 에러를 반환한다', async () => {
      validator.validateCommentOwner.mockResolvedValue({
        statusCode: 403,
        error: { code: CommunityErrorCode.FORBIDDEN, message: 'Forbidden' },
        data: null
      } as any);

      const result = await service.updateComment(userId, commentId, { content: '수정내용' });

      expect(result.statusCode).toBe(403);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(CommunityErrorCode.FORBIDDEN);
      }
    });

    it('성공: 권한이 확인되면 댓글 내용을 수정한다', async () => {
      validator.validateCommentOwner.mockResolvedValue({ data: {} } as any);

      const result = await service.updateComment(userId, commentId, { content: '수정완료' });

      expect(isSuccess(result)).toBe(true);
      expect(commentRepository.updateComment).toHaveBeenCalledWith(BigInt(commentId), '수정완료');
    });
  });

  describe('getComments', () => {
    it('성공: 특정 리소스의 댓글 목록을 반환한다', async () => {
      const userId = BigInt(1); 
      
      validator.validateTargetResource.mockResolvedValue({ data: {} } as any);
      commentRepository.findCommentsByTarget.mockResolvedValue([
        { id: BigInt(1), parentId: null, userId: BigInt(1), user: { nickname: '작성자' }, content: 'ㅎㅇ', createdAt: new Date() }
      ] as any);

      const result = await service.getComments(CommunityTargetType.POST, 100, userId);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.comments).toHaveLength(1);
        expect(result.data.comments[0].nickname).toBe('작성자');
      }
    });
  });

  // 6. 댓글 삭제 테스트
  describe('deleteComment', () => {
    const userId = BigInt(1);
    const commentId = 50;

    it('실패: 삭제하려는 댓글이 존재하지 않으면 COMMENT_NOT_FOUND 에러를 반환한다', async () => {
      // validator에서 NotFound 결과 반환 시뮬레이션
      validator.validateCommentOwner.mockResolvedValue({
        statusCode: 404,
        error: { code: CommunityErrorCode.COMMENT_NOT_FOUND, message: '댓글을 찾을 수 없습니다.' },
        data: null
      } as any);

      const result = await service.deleteComment(userId, commentId);

      expect(result.statusCode).toBe(404);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(CommunityErrorCode.COMMENT_NOT_FOUND);
      }
      // 삭제 로직이 호출되지 않아야 함
      expect(commentRepository.deleteComment).not.toHaveBeenCalled();
    });

    it('실패: 본인의 댓글이 아닌 경우(작성자 불일치) FORBIDDEN 에러를 반환한다', async () => {
      // validator에서 권한 에러 반환 시뮬레이션
      validator.validateCommentOwner.mockResolvedValue({
        statusCode: 403,
        error: { code: CommunityErrorCode.FORBIDDEN, message: '권한이 없습니다.' },
        data: null
      } as any);

      const result = await service.deleteComment(userId, commentId);

      expect(result.statusCode).toBe(403);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(CommunityErrorCode.FORBIDDEN);
      }
      expect(commentRepository.deleteComment).not.toHaveBeenCalled();
    });

    it('성공: 존재하는 본인 댓글인 경우 삭제를 완료하고 성공 메시지를 반환한다', async () => {
      // validator 통과 시뮬레이션
      validator.validateCommentOwner.mockResolvedValue({ data: { id: BigInt(commentId) } } as any);
      commentRepository.deleteComment.mockResolvedValue({ id: BigInt(commentId) } as any);

      const result = await service.deleteComment(userId, commentId);

      expect(result.statusCode).toBe(200);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.message).toBe("댓글이 삭제되었습니다.");
      }
      // 실제 레포지토리의 삭제 메서드가 올바른 ID로 호출되었는지 확인
      expect(commentRepository.deleteComment).toHaveBeenCalledWith(BigInt(commentId));
    });
  });

  describe('Highlight 연동 권한 테스트', () => {
    const userId = BigInt(1);
    const highlightId = 200;
    const highlightDto = { target_type: CommunityTargetType.HIGHLIGHT, target_id: highlightId };

    it('실패: 아지트 비공개 하이라이트에 외부인이 접근하면 403 에러를 반환한다', async () => {
      // 1. Validator가 아지트 멤버십 체크 후 403 Forbidden 결과 반환 시뮬레이션
      validator.validateTargetResource.mockResolvedValue({
        statusCode: 403,
        error: { 
          code: CommunityErrorCode.FORBIDDEN, 
          message: '해당 아지트 멤버만 접근 가능한 하이라이트입니다.' 
        },
        data: null
      } as any);

      const result = await service.toggleLike(userId, highlightDto);

      // 2. 서비스가 Validator의 에러 결과를 그대로 상위로 던지는지 확인
      expect(result.statusCode).toBe(403);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(CommunityErrorCode.FORBIDDEN);
        expect(result.error.message).toContain('아지트 멤버');
      }
      // 권한이 없으므로 레포지토리 로직은 실행되지 않아야 함
      expect(likeRepository.findLike).not.toHaveBeenCalled();
    });

    it('성공: 커뮤니티 직접 등록 하이라이트(azitId: null)는 모든 유저가 접근 가능하다', async () => {
      // 1. Validator가 하이라이트 존재 확인 및 권한 통과(null) 시뮬레이션
      validator.validateTargetResource.mockResolvedValue({ 
        data: { id: BigInt(highlightId), azitId: null, isPublic: true } 
      } as any);
      
      likeRepository.findLike.mockResolvedValue(null);
      likeRepository.countLikes.mockResolvedValue(5);

      const result = await service.toggleLike(userId, highlightDto);

      // 2. 정상적으로 좋아요 로직이 실행되는지 확인
      expect(result.statusCode).toBe(200);
      expect(isSuccess(result) && result.data.is_liked).toBe(true);
      expect(likeRepository.createLike).toHaveBeenCalled();
    });

    it('성공: 아지트 하이라이트라도 PUBLIC 설정이면 비멤버도 댓글 작성이 가능하다', async () => {
      // 1. Validator가 PUBLIC 권한 확인 시뮬레이션
      validator.validateTargetResource.mockResolvedValue({ 
        data: { id: BigInt(highlightId), azitId: BigInt(10), isPublic: true } 
      } as any);
      
      const commentDto = { ...highlightDto, content: '공개 하이라이트 댓글' };
      commentRepository.createComment.mockResolvedValue({
        id: BigInt(1), userId: userId, content: commentDto.content, user: { nickname: '시영' }
      } as any);

      const result = await service.createComment(userId, commentDto);

      // 2. 정상 생성 확인
      expect(result.statusCode).toBe(201);
      expect(isSuccess(result) && result.data.nickname).toBe('시영');
      expect(commentRepository.createComment).toHaveBeenCalled();
    });
  });
});