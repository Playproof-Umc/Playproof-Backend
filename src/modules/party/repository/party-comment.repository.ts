import { prisma } from "../../../common/config/database";
import { singleton } from "tsyringe";
import { PostComment } from "@prisma/client";

@singleton()
export class PartyCommentRepository {
  // 1. 댓글 상세 조회
  async findById(commentId: number): Promise<PostComment | null> {
    return prisma.postComment.findUnique({
      where: { id: BigInt(commentId) }
    });
  }

  // 2. 댓글 목록 조회 (대댓글 포함)
  async findCommentsByPartyId(postId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;
    
    const [comments, total] = await Promise.all([
      prisma.postComment.findMany({
        where: { 
          postId: BigInt(postId),
          parentId: null 
        },
        include: { 
          replies: {
            include: { user: true }
          },
          user: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' }
      }),
      prisma.postComment.count({ 
        where: { 
          postId: BigInt(postId),
          parentId: null 
        } 
      })
    ]);

    return { comments, total };
  }

  // 3. 댓글 생성
  async create(userId: number, postId: number, content: string, parentId?: number): Promise<PostComment> {
    return prisma.postComment.create({
      data: {
        userId: BigInt(userId),
        postId: BigInt(postId),
        content,
        parentId: parentId ? BigInt(parentId) : null
      }
    });
  }

  // 4. 댓글 수정
  async update(commentId: number, content: string): Promise<PostComment> {
    return prisma.postComment.update({
      where: { id: BigInt(commentId) },
      data: { content }
    });
  }

  // 5. 댓글 삭제
  async delete(commentId: number): Promise<PostComment> {
    return prisma.postComment.delete({
      where: { id: BigInt(commentId) }
    });
  }
}