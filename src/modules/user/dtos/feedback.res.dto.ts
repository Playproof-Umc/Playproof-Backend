// src/modules/user/dtos/feedback.res.dto.ts
export class UserFeedbackCardDto {
  /** @example 1 */
  feedbackId!: number;
  /** @example "최고의 서폿이었어요.." */
  content!: string | null;
  /** @example 5 */
  tsScoreChange!: number;
  /** @example "2026-02-10T00:00:00.000Z" */
  createdAt!: Date;
  
  /** 
   * @example 
   * {
   *   id: 2,
   *   nickname: "게임마스터",
   *   avatarUrl: "https://example.com/avatar.png"
   * }
   */
  writer!: {
    id: number;
    nickname: string | null;
    avatarUrl: string | null;
    trustScore: number;
  };

  tags!: string[];
}