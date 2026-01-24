import { singleton, inject } from "tsyringe";
// import { HighlightRepository } from "../../highlight/repositories/highlight.repository";
import { CommunityPostRepository } from "../repositories/community-post.repository";
import { CommunityCommentRepository } from "../repositories/community-comment.repository";
import { CommunityTargetType } from "../types/community-type";
import { Result, notFound, forbidden, badRequest } from "../../../common/types/result.type";
import { CommunityErrorCode } from "../../../common/constants/error-code";

@singleton()
export class CommunityValidator {
  constructor(
    // HighlightRepository 나중에 추가
    // @inject(HighlightRepository) private highlightRepository: HighlightRepository,
    @inject(CommunityPostRepository) private postRepository: CommunityPostRepository,
    @inject(CommunityCommentRepository) private commentRepository: CommunityCommentRepository
  ) {}

  async validateTargetResource(targetType: CommunityTargetType, targetId: bigint): Promise<Result<any>> {
    if (targetType === CommunityTargetType.HIGHLIGHT) {
    //   const highlight = await this.highlightRepository.findHighlightById(targetId);
    //   if (!highlight) {
    //     return notFound({
    //       message: "해당 하이라이트를 찾을 수 없습니다.",
    //       errorCode: CommunityErrorCode.HIGHLIGHT_NOT_FOUND
    //     });
    //   }
    //   return { data: highlight } as any;

      return { data: { id: targetId } } as any;
    } 
    
    if (targetType === CommunityTargetType.POST) {
      const post = await this.postRepository.findById(Number(targetId));
      if (!post) {
        return notFound({
          message: "해당 게시글을 찾을 수 없습니다.",
          errorCode: CommunityErrorCode.POST_NOT_FOUND
        });
      }
      return { data: post } as any;
    }

    return badRequest({
      message: "잘못된 타겟 타입입니다.",
      errorCode: CommunityErrorCode.INVALID_TARGET_TYPE
    });
  }

  async validateCommentOwner(commentId: bigint, userId: bigint): Promise<Result<any>> {
    const comment = await this.commentRepository.findCommentById(commentId);
    if (!comment) {
      return notFound({
        message: "해당 댓글을 찾을 수 없습니다.",
        errorCode: CommunityErrorCode.COMMENT_NOT_FOUND
      });
    }

    if (comment.userId !== userId) {
      return forbidden({
        message: "본인의 댓글만 수정/삭제할 수 있습니다.",
        errorCode: CommunityErrorCode.FORBIDDEN
      });
    }

    return { data: comment } as any;
  }

  async validateParentComment(parentId: bigint): Promise<Result<any>> {
    const parent = await this.commentRepository.findCommentById(parentId);
    if (!parent) {
      return notFound({
        message: "답글을 달려는 원본 댓글을 찾을 수 없습니다.",
        errorCode: CommunityErrorCode.COMMENT_NOT_FOUND
      });
    }
    return { data: parent } as any;
  }
}