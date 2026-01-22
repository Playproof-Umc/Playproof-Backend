import { injectable, inject } from "tsyringe";
import { Result, ok, created, notFound, forbidden } from "../../../common/types/result.type";
import { PartyCommentRepository } from "../repository/party-comment.repository";
import { PartyRepository } from "../repository/party.repository";
import { CommentListResDto, CommentActionResDto } from "../dtos/party-comment.res.dto";
import { PartyErrorCode } from "../../../common/constants/error-code";
import { PartyValidator } from "../utils/party.validator";

@injectable()
export class PartyCommentService {
  constructor(
    @inject(PartyCommentRepository) private readonly commentRepo: PartyCommentRepository,
    @inject(PartyRepository) private readonly partyRepo: PartyRepository
  ) {}

  private formatDate(date: Date): string {
    const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    return kstDate.toISOString().replace('T', ' ').substring(0, 19);
  }

  // 1. 댓글 목록 조회 (getComments)
  async getComments(partyId: number, page: number, limit: number): Promise<Result<CommentListResDto>> {
    // 1-1. 파티 존재 확인
    const { error } = await PartyValidator.validateParty(this.partyRepo, partyId);
    if (error) return error;

    // 1-2. 목록 조회 및 반환
    const { comments, total } = await this.commentRepo.findCommentsByPartyId(partyId, page, limit);
    return ok({
      comments: comments.map(c => ({
        commentId: Number(c.id),
        userId: Number(c.userId),
        nickname: (c as any).user?.nickname || "알 수 없음",
        content: c.content,
        createdAt: this.formatDate(c.createdAt),
        parentId: c.parentId ? Number(c.parentId) : null,
        replies: (c as any).replies?.map((r: any) => ({
          commentId: Number(r.id),
          userId: Number(r.userId),
          nickname: r.user?.nickname || "알 수 없음",
          content: r.content,
          createdAt: this.formatDate(r.createdAt),
          parentId: Number(r.parentId)
        }))
      })),
      meta: { currentPage: page, totalPages: Math.ceil(total / limit), totalComments: total, limit }
    } as CommentListResDto);
  }

  // 2. 댓글 작성 (createComment)
  async createComment(userId: number, partyId: number, content: string, parentId?: number | null): Promise<Result<CommentActionResDto>> {
    // 2-1. 파티 존재 확인
    const { error } = await PartyValidator.validateParty(this.partyRepo, partyId);
    if (error) return error;

    // 2-2. 대댓글 시 부모 댓글 존재 확인 (Validator 활용)
    if (parentId) {
      const { error: parentError } = await PartyValidator.validateCommentOwnership(this.commentRepo, parentId, -1); // 권한 체크 제외를 위해 -1 전달
      if (parentError && parentError.statusCode === 404) return parentError;
    }

    // 2-3. 생성 및 반환
    const comment = await this.commentRepo.create(userId, partyId, content, parentId);
    return created({
      commentId: Number(comment.id),
      partyId: Number(comment.postId),
      userId: Number(comment.userId),
      content: comment.content,
      parentId: comment.parentId ? Number(comment.parentId) : null,
      createdAt: this.formatDate(comment.createdAt)
    } as CommentActionResDto);
  }

  // 3. 댓글 수정 (updateComment)
  async updateComment(userId: number, commentId: number, content: string): Promise<Result<CommentActionResDto>> {
    // 3-1. 댓글 존재 및 권한 통합 검증
    const { error } = await PartyValidator.validateCommentOwnership(this.commentRepo, commentId, userId);
    if (error) return error;

    // 3-2. 업데이트
    const updated = await this.commentRepo.update(commentId, content);
    return ok({
      commentId: Number(updated.id),
      content: updated.content,
      updatedAt: this.formatDate(updated.updatedAt)
    } as CommentActionResDto);
  }

  // 4. 댓글 삭제 (deleteComment)
  async deleteComment(userId: number, commentId: number): Promise<Result<CommentActionResDto>> {
    // 4-1. 댓글 존재 및 권한 통합 검증
    const { error } = await PartyValidator.validateCommentOwnership(this.commentRepo, commentId, userId);
    if (error) return error;

    // 4-2. 삭제 처리
    await this.commentRepo.delete(commentId);
    return ok({
      commentId,
      message: "댓글이 삭제되었습니다.",
      deletedAt: this.formatDate(new Date())
    } as CommentActionResDto);
  }
}