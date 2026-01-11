import { injectable } from "tsyringe";
import { Result, ok, created, notFound, forbidden } from "../../../common/types/result.type";
import { PartyCommentRepository } from "../repository/party-comment.repository";
import { PartyRepository } from "../repository/party.repository";
import { CommentListResDto, CommentActionResDto } from "../dtos/party-comment.res.dto";

@injectable()
export class PartyCommentService {
  constructor(
    private readonly partyCommentRepository: PartyCommentRepository,
    private readonly partyRepository: PartyRepository
  ) {}

  // 1. 날짜 포맷팅 유틸리티
  private formatDate(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  // 2. 댓글 목록 조회
  async getComments(partyId: number, page: number, limit: number): Promise<Result<CommentListResDto>> {
    const party = await this.partyRepository.findPartyPostById(partyId);
    if (!party) return notFound({ message: "존재하지 않는 파티입니다.", errorCode: "PARTY_404" });

    const { comments, total } = await this.partyCommentRepository.findCommentsByPartyId(partyId, page, limit);
    
    return ok({
      comments: comments.map(c => ({
        commentId: Number(c.id),
        userId: Number(c.userId),
        nickname: (c as any).user?.name || "알 수 없음",
        content: c.content,
        createdAt: this.formatDate(c.createdAt),
        parentId: c.parentId ? Number(c.parentId) : null,
        replies: (c as any).replies?.map((r: any) => ({
          commentId: Number(r.id),
          userId: Number(r.userId),
          nickname: r.user?.name || "알 수 없음",
          content: r.content,
          createdAt: this.formatDate(r.createdAt),
          parentId: Number(r.parentId)
        }))
      })),
      meta: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalComments: total,
        limit
      }
    });
  }

  // 3. 댓글 작성
  async createComment(userId: number, partyId: number, content: string, parentId?: number): Promise<Result<CommentActionResDto>> {
    const party = await this.partyRepository.findPartyPostById(partyId);
    if (!party) return notFound({ message: "존재하지 않는 파티입니다.", errorCode: "PARTY_404" });

    const comment = await this.partyCommentRepository.create(userId, partyId, content, parentId);
    
    return created({
      commentId: Number(comment.id),
      partyId: Number(comment.postId),
      userId: Number(comment.userId),
      content: comment.content,
      parentId: comment.parentId ? Number(comment.parentId) : null,
      createdAt: this.formatDate(comment.createdAt)
    });
  }

  // 4. 댓글 수정
  async updateComment(userId: number, commentId: number, content: string): Promise<Result<CommentActionResDto>> {
    const comment = await this.partyCommentRepository.findById(commentId);
    if (!comment) return notFound({ message: "댓글을 찾을 수 없습니다.", errorCode: "COMMENT_404" });

    if (Number(comment.userId) !== Number(userId)) {
      return forbidden({ 
        message: "본인이 작성한 댓글만 수정할 수 있습니다.", 
        errorCode: "COMMON_403",
        errors: [{ field: "userId", value: userId, reason: "댓글 작성자 ID와 요청자 ID가 일치하지 않습니다." }]
      });
    }

    const updated = await this.partyCommentRepository.update(commentId, content);
    return ok({
      commentId: Number(updated.id),
      content: updated.content,
      updatedAt: this.formatDate(updated.updatedAt)
    });
  }

  // 5. 댓글 삭제
  async deleteComment(userId: number, commentId: number): Promise<Result<CommentActionResDto>> {
    const comment = await this.partyCommentRepository.findById(commentId);
    if (!comment) return notFound({ message: "댓글을 찾을 수 없습니다.", errorCode: "COMMENT_404" });

    if (Number(comment.userId) !== Number(userId)) {
      return forbidden({ message: "본인이 작성한 댓글만 삭제할 수 있습니다.", errorCode: "COMMON_403" });
    }

    await this.partyCommentRepository.delete(commentId);
    return ok({
      commentId,
      message: "댓글이 삭제되었습니다.",
      deletedAt: this.formatDate(new Date())
    });
  }
}