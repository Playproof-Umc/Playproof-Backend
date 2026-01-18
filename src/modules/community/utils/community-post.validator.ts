import { CommunityPostRepository } from "../repositories/community-post.repository";
import { Result, notFound, forbidden, ok } from "../../../common/types/result.type";

// 1. 게시글 존재 및 권한 검증
export async function validatePostOwnership<T>(
  repository: CommunityPostRepository,
  postId: number,
  userId: number
): Promise<Result<T> | { post: any }> {
  const post = await repository.findById(postId);

  // 2. 게시글 존재 여부 확인
  if (!post) {
    return notFound({
      message: "게시글을 찾을 수 없습니다."
    });
  }

  // 3. 작성자 권한 확인
  if (Number(post.userId) !== userId) {
    return forbidden({
      message: "해당 권한이 없습니다."
    });
  }

  return { post };
}