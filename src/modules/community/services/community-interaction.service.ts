import { injectable, inject } from "tsyringe";
import { CommunityLikeRepository } from "../repositories/community-like.repository";
import { CommunityCommentRepository } from "../repositories/community-comment.repository";
import { CommunityInteractionValidator } from "../utils/community-interaction.validator";
import { CommunityTargetType } from "../types/community-type";
import { 
  CommunityLikeReqDto, 
  CommunityCommentCreateReqDto, 
  CommunityCommentUpdateReqDto 
} from "../dtos/community-interaction.req.dto";
import { 
  CommunityLikeResDto, 
  CommunityCommentResDto, 
  CommunityCommentListResDto 
} from "../dtos/community-interaction.res.dto";
import { Result, ok, created, internalServerError } from "../../../common/types/result.type";

@injectable()
export class CommunityInteractionService {
  constructor(
    @inject(CommunityLikeRepository) private likeRepository: CommunityLikeRepository,
    @inject(CommunityCommentRepository) private commentRepository: CommunityCommentRepository,
    @inject(CommunityInteractionValidator) private validator: CommunityInteractionValidator
  ) {}

  /**
   * 좋아요 토글 비즈니스 로직
   */
  async toggleLike(userId: bigint, dto: CommunityLikeReqDto): Promise<Result<CommunityLikeResDto>> {
    // 1. 대상 리소스 존재 여부 검증
    const resourceCheck = await this.validator.validateTargetResource(dto.target_type, BigInt(dto.target_id), userId);
    if (resourceCheck.error) return resourceCheck;

    // 2. 기존 좋아요 여부 확인
    const existingLike = await this.likeRepository.findLike(userId, dto.target_type, BigInt(dto.target_id));

    if (existingLike) {
      // 3-1. 이미 있다면 삭제 (취소)
      await this.likeRepository.deleteLike(existingLike.id);
    } else {
      // 3-2. 없다면 생성
      await this.likeRepository.createLike(userId, dto.target_type, BigInt(dto.target_id));
    }

    // 4. 최신 좋아요 개수 조회 및 응답
    const likeCount = await this.likeRepository.countLikes(dto.target_type, BigInt(dto.target_id));

    return ok({
      is_liked: !existingLike,
      like_count: likeCount,
      message: existingLike ? "좋아요가 취소되었습니다." : "좋아요가 반영되었습니다."
    });
  }

  /**
   * 댓글 작성 비즈니스 로직
   */
  async createComment(userId: bigint, dto: CommunityCommentCreateReqDto): Promise<Result<CommunityCommentResDto>> {
    // 1. 대상 리소스 존재 여부 검증
    const resourceCheck = await this.validator.validateTargetResource(dto.target_type, BigInt(dto.target_id), userId);
    if (resourceCheck.error) return resourceCheck;

    // 2. 답글인 경우 부모 댓글 존재 여부 검증
    if (dto.parent_id) {
      const parentCheck = await this.validator.validateParentComment(BigInt(dto.parent_id));
      if (parentCheck.error) return parentCheck;
    }

    // 3. 댓글 생성
    const comment = await this.commentRepository.createComment(
      userId,
      dto.target_type,
      BigInt(dto.target_id),
      dto.content,
      dto.parent_id ? BigInt(dto.parent_id) : undefined
    );

    return created({
      comment_id: Number(comment.id),
      parent_id: comment.parentId ? Number(comment.parentId) : null,
      user_id: Number(comment.userId),
      nickname: comment.user.nickname ?? "익명",
      content: comment.content,
      created_at: comment.createdAt
    });
  }

  /**
   * 댓글 목록 조회 비즈니스 로직
   */
  async getComments(targetType: CommunityTargetType, targetId: number, userId: bigint): Promise<Result<CommunityCommentListResDto>> {
    // 1. 대상 리소스 존재 여부 검증
    const resourceCheck = await this.validator.validateTargetResource(targetType, BigInt(targetId), userId);
    if (resourceCheck.error) return resourceCheck;

    // 2. 댓글 목록 조회
    const comments = await this.commentRepository.findCommentsByTarget(targetType, BigInt(targetId));

    return ok({
      comments: comments.map(c => ({
        comment_id: Number(c.id),
        parent_id: c.parentId ? Number(c.parentId) : null,
        user_id: Number(c.userId),
        nickname: c.user.nickname ?? "익명",
        content: c.content,
        created_at: c.createdAt
      }))
    });
  }

  /**
   * 댓글 수정 비즈니스 로직
   */
  async updateComment(userId: bigint, commentId: number, dto: CommunityCommentUpdateReqDto): Promise<Result<{ message: string }>> {
    // 1. 댓글 존재 및 작성자 권한 검증
    const authCheck = await this.validator.validateCommentOwner(BigInt(commentId), userId);
    if (authCheck.error) return authCheck;

    // 2. 댓글 수정
    await this.commentRepository.updateComment(BigInt(commentId), dto.content);

    return ok({ message: "댓글이 성공적으로 수정되었습니다." });
  }

  /**
   * 댓글 삭제 비즈니스 로직
   */
  async deleteComment(userId: bigint, commentId: number): Promise<Result<{ message: string }>> {
    // 1. 댓글 존재 및 작성자 권한 검증
    const authCheck = await this.validator.validateCommentOwner(BigInt(commentId), userId);
    if (authCheck.error) return authCheck;

    // 2. 댓글 삭제
    await this.commentRepository.deleteComment(BigInt(commentId));

    return ok({ message: "댓글이 삭제되었습니다." });
  }
}