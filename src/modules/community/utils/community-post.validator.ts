import { CommunityPostRepository } from "../repositories/community-post.repository";
import { notFound, forbidden, badRequest, Result } from "../../../common/types/result.type";
import { CommunityErrorCode } from "../../../common/constants/error-code";

export class CommunityPostValidator {
  // 1. 게시글 존재 여부 검증
  static async validatePost(
    repository: CommunityPostRepository, 
    postId: number,
    userId?: number | null
  ): Promise<{ post?: any; error?: Result<any> }> {
    const post = await repository.findById(postId, userId);
    
    if (!post) {
      return { 
        error: notFound({ 
          message: "게시글을 찾을 수 없습니다.", 
          errorCode: CommunityErrorCode.POST_NOT_FOUND 
        }) 
      };
    }
    
    return { post };
  }

  // 2. 게시글 권한 검증
  static async checkPostOwnership(
    repository: CommunityPostRepository, 
    postId: number, 
    userId: number
  ): Promise<{ post?: any; error?: Result<any> }> {
    const { post, error } = await this.validatePost(repository, postId);
    if (error) return { error };

    if (Number(post.userId) !== userId) {
      return { 
        error: forbidden({ 
          message: "해당 권한이 없습니다.", 
          errorCode: CommunityErrorCode.FORBIDDEN 
        }) 
      };
    }
    
    return { post };
  }

  // 3. 마스터 데이터(게임) 검증
  static async validateMasterData(
    repository: CommunityPostRepository,
    gameId: number
  ): Promise<Result<any> | null> {
    const game = await repository.findGameById(gameId);
    
    if (!game) {
      return notFound({ 
        message: "존재하지 않는 게임 카테고리입니다.", 
        errorCode: CommunityErrorCode.GAME_NOT_FOUND 
      });
    }
    
    return null;
  }

  // 4. 페이지네이션 파라미터 검증
  static validatePagination(page: number, size: number): Result<any> | null {
    const errors = [] as { field: string; value: number; reason: string }[];

    if (page < 1) {
      errors.push({
        field: "page",
        value: page,
        reason: "page는 1 이상이어야 합니다.",
      });
    }

    if (size < 1) {
      errors.push({
        field: "size",
        value: size,
        reason: "size는 1 이상이어야 합니다.",
      });
    }

    if (errors.length > 0) {
      return badRequest({
        message: "요청 파라미터가 잘못되었습니다.",
        errorCode: "COMMON_INVALID_PARAMETER",
        errors,
      });
    }

    return null;
  }
}