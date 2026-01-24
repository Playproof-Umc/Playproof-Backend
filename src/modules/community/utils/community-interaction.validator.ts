import { singleton, inject } from "tsyringe";
import { CommunityTargetType } from "../types/community-type";
import { CommunityPostRepository } from "../repositories/community-post.repository";
import { HighlightRepository } from "../../highlight/repositories/highlight.repository";
import { AzitUserRepository } from "../../azit/repositories/azit-user.repository"; 
import { CommunityErrorCode } from "../../../common/constants/error-code";
import { CommunityCommentRepository } from "../repositories/community-comment.repository";
import { Result, notFound, forbidden, badRequest, success } from "../../../common/types/result.type";


@singleton()
export class CommunityInteractionValidator {
  constructor(
    @inject(HighlightRepository) private highlightRepository: HighlightRepository,
    @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
    @inject(CommunityPostRepository) private postRepository: CommunityPostRepository,
    @inject(CommunityCommentRepository) private commentRepository: CommunityCommentRepository
  ) {}

  /**
   * 상호작용(좋아요/댓글) 대상 리소스의 유효성 및 권한 검증
   */
  async validateTargetResource(
    targetType: CommunityTargetType,
    targetId: bigint,
    userId: bigint
  ): Promise<Result<any>> {
    
    // 1. 하이라이트(HIGHLIGHT) 검증 로직
    if (targetType === CommunityTargetType.HIGHLIGHT) {
      const highlight = await this.highlightRepository.findHighlightById(targetId);
      
      if (!highlight) {
        return notFound({ 
          message: "하이라이트를 찾을 수 없습니다.", 
          errorCode: CommunityErrorCode.HIGHLIGHT_NOT_FOUND 
        });
      }

      // 권한 체크
      // 공개 상태(isPublic: true)라면 출처와 상관없이 모든 사용자 인터랙션 허용
      // 1. 공개 상태, 사용자 관계 없이 접근 허용
      if (!highlight.isPublic) {
        
        // 2. 비공개 상테, 아지트 소속 멤버인지 확인
        if (highlight.azitId) {
          const isMember = await this.azitUserRepository.isMember(
            highlight.azitId, 
            userId
          );
          if (!isMember) {
            return forbidden({ 
              message: "해당 아지트 멤버만 접근 가능한 하이라이트입니다.", 
              errorCode: CommunityErrorCode.FORBIDDEN 
            });
          }
        } 
        
        // 3. 아지트에서 추가한게 아닌 사용자가 직접 하이라이트 등록, 본인 여부 확인
        else {
          if (highlight.userId !== userId) {
            return forbidden({ 
              message: "비공개 하이라이트에 대한 접근 권한이 없습니다.", 
              errorCode: CommunityErrorCode.FORBIDDEN 
            });
          }
        }
      }

      return success(highlight);
    }

    // 2. 일반 게시글(POST) 검증 로직
    if (targetType === CommunityTargetType.POST) {
      const post = await this.postRepository.findById(Number(targetId));
      
      if (!post) {
        return notFound({ 
          message: "게시글을 찾을 수 없습니다.", 
          errorCode: CommunityErrorCode.POST_NOT_FOUND 
        });
      }

      return success(post);
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