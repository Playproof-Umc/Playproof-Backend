import { IsArray, IsNumber, IsString } from "class-validator";

export class FeedbackCreateResDto {
  /**
   * 생성된 피드백 ID
   * @example 1
   */
  @IsNumber()
  id!: number;
}

export class FeedbackCategoryResDto {
  /**
   * 카테고리 ID
   * @example 1
   */
  @IsNumber()
  id!: number;

  /**
   * 카테고리 이름
   * @example "협력적이었어요"
   */
  @IsString()
  name!: string;

  /**
   * 정적 팩토리 메서드
   */
  static from(category: { id: bigint; name: string }): FeedbackCategoryResDto {
    return {
      id: Number(category.id),
      name: category.name,
    };
  }
}

export class FeedbackResDto {
  /**
   * 피드백 ID
   * @example 1
   */
  @IsNumber()
  feedback_id!: number;

  /**
   * 피드백을 작성한 사용자의 닉네임
   * @example "레나"
   */
  @IsString()
  nickname!: string | null;

  /**
   * 피드백을 작성한 사용자의 프로필 이미지 URL
   * @example "https://example.com/avatar.png"
   */
  @IsString()
  profile_image_url!: string | null;

  /**
   * 피드백을 작성한 사용자의 TS 점수
   * @example 98
   */
  @IsNumber()
  ts_score!: number;

  /**
   * 피드백 내용 (메모)
   * @example "최고의 서폿이었어요!"
   */
  @IsString()
  content!: string | null;

  // TODO: 피드백에서 TS 점수 반영 기능 구현 후 주석 해제
  // /**
  //  * 이 피드백으로 받은 TS 점수 변화량
  //  * @example 5
  //  */
  // @IsNumber()
  // ts_score_change!: number;

  /**
   * 긍정 카테고리 목록
   * @example [{ id: 1, name: "협력 유저" }, { id: 2, name: "하드캐리" }]
   */
  @IsArray()
  positive_categories!: FeedbackCategoryResDto[];

  /**
   * 부정 카테고리 목록
   * @example []
   */
  @IsArray()
  negative_categories!: FeedbackCategoryResDto[];

  /**
   * 정적 팩토리 메서드
   */
  static from(feedback: {
    id: bigint;
    content: string | null;
    user: {
      id: bigint;
      nickname: string | null;
      trustScore: number;
      userAvatars: {
        avatar: {
          avatarUrl: string;
        } | null;
      }[];
    };
    positiveCategories: {
      positive: {
        id: bigint;
        name: string;
      };
    }[];
    negativeCategories: {
      negative: {
        id: bigint;
        name: string;
      };
    }[];
  }): FeedbackResDto {
    const equippedAvatar = feedback.user.userAvatars[0];
    const profileImageUrl = equippedAvatar?.avatar?.avatarUrl || null;

    return {
      feedback_id: Number(feedback.id),
      nickname: feedback.user.nickname,
      profile_image_url: profileImageUrl,
      ts_score: feedback.user.trustScore,
      content: feedback.content,
      // TODO: 피드백에서 TS 점수 반영 기능 구현 후 주석 해제
      // ts_score_change: feedback.tsScoreChange || 0,
      positive_categories: feedback.positiveCategories.map((pc) =>
        FeedbackCategoryResDto.from(pc.positive),
      ),
      negative_categories: feedback.negativeCategories.map((nc) =>
        FeedbackCategoryResDto.from(nc.negative),
      ),
    };
  }
}

export class FeedbackListResDto {
  /**
   * 피드백 목록
   */
  @IsArray()
  feedbacks!: FeedbackResDto[];

  /**
   * 다음 커서 (더 이상 데이터가 없으면 null)
   * @example "2024-01-15T10:30:00|123"
   */
  @IsString()
  next_cursor!: string | null;

  /**
   * 다음 페이지 존재 여부
   * @example true
   */
  has_next!: boolean;

  /**
   * 정적 팩토리 메서드: 피드백 목록 DTO 생성
   */
  static from(
    feedbacks: FeedbackResDto[],
    nextCursor: string | null,
    hasNext: boolean,
  ): FeedbackListResDto {
    return {
      feedbacks,
      next_cursor: nextCursor,
      has_next: hasNext,
    };
  }
}

export class FeedbackPendingResDto {
  /**
   * 일정 ID
   * @example 1
   */
  @IsNumber()
  schedule_id!: number;

  /**
   * 사용자 ID
   * @example 1
   */
  @IsNumber()
  user_id!: number;

  /**
   * 닉네임
   * @example "홍길동"
   */
  @IsString()
  nickname!: string | null;

  /**
   * 아바타 URL (착용한 아바타가 없을 경우 null)
   * @example "https://example.com/avatar.png"
   */
  @IsString()
  avatar_url!: string | null;

  /**
   * 정적 팩토리 메서드
   */
  static from(participation: {
    scheduleId: bigint;
    member: {
      userId: bigint;
      user: {
        id: bigint;
        nickname: string | null;
        userAvatars: {
          avatar: {
            avatarUrl: string;
          } | null;
        }[];
      };
    };
  }): FeedbackPendingResDto {
    const user = participation.member.user;
    const avatarUrl = user.userAvatars?.[0]?.avatar?.avatarUrl || null;

    return {
      schedule_id: Number(participation.scheduleId),
      user_id: Number(user.id),
      nickname: user.nickname,
      avatar_url: avatarUrl,
    };
  }
}

export class FeedbackPendingListResDto {
  /**
   * 피드백 미완료 대상자 목록
   */
  @IsArray()
  targets!: FeedbackPendingResDto[];
}



