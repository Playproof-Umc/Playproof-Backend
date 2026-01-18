import { CommunityPostRepository } from "../repositories/community-post.repository";
import { Result, notFound, forbidden } from "../../../common/types/result.type";

// 1. 게임 카테고리 존재 검증 🏁
export async function validateGameExists<T>(
  repository: CommunityPostRepository,
  gameId: number
): Promise<Result<T> | null> {
  const game = await repository.findGameById(gameId);

  if (!game) {
    return notFound({
      message: "존재하지 않는 게임 카테고리입니다."
    });
  }

  return null;
}

// 2. 게시글 존재 및 권한 검증
export async function validatePostOwnership<T>(
  repository: CommunityPostRepository,
  postId: number,
  userId: number
): Promise<Result<T> | { post: any }> {
  const post = await repository.findById(postId);

  if (!post) {
    return notFound({
      message: "게시글을 찾을 수 없습니다."
    });
  }

  if (Number(post.userId) !== userId) {
    return forbidden({
      message: "해당 권한이 없습니다."
    });
  }

  return { post };
}