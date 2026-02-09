/**
 * TemperScore (TS) 계산 유틸
 * - 신뢰·매너 점수 0~100, 시작값 60
 * - 점수 올리기(칭찬): W_diversity, W_relation, W_time 적용 후 Feedback.tsScoreChange에 반영.
 * - 점수 내리기(감점): Feedback.tsScoreChange 한 건 적용.
 */

// ---------------------------------------------------------------------------
// 상수
// ---------------------------------------------------------------------------

// 피드백 점수 = Feedback.tsScoreChange (DB 필드, 기본값 0)
export const FEEDBACK_TS_SCORE_CHANGE_DEFAULT = 0;

export const TS_MIN = 0;
export const TS_MAX = 100;
export const TS_INITIAL = 60;

// Zone 배수, 미구현: 상수만 두고 배수 적용은 추후 구현.
export const ZONE_MULTIPLIER = {
  normal: 1.0,
  pro: 1.2,
  temper: 1.5,
} as const;

// 일일 TS 변동 Clamp. 미적용: 오늘 누적 변동량 있을 때 상위(배치 등)에서 적용 예정.
export const CLAMP_DAILY = 7;
// 주간 TS 변동 Clamp
export const CLAMP_WEEKLY = 20;

// 보호구간: 이 점수 이상이면 변동 절반
export const PROTECTION_HIGH = 95;
// 보호구간: 이 점수 이하면 변동 절반
export const PROTECTION_LOW = 60;

// EMA 완충 계수 (감쇠 등 완만 반영용)
export const EMA_ALPHA = 0.2;

// 부정 카테고리 id. DB negative_categories.seed 순서와 매핑 (4개)
export enum NegativeCategoryId {
  ExcessiveProfanity = 1, // 과도한 욕설
  AccountTheft = 2, // 계정 도용 행위
  TrollingAbuse = 3, // 고의 트롤, 어뷰징
  CheatSuspected = 4, // 핵, 치트 의심
}

// 부정 카테고리 id → 감점
export const NEGATIVE_PENALTIES: Record<NegativeCategoryId, number> = {
  [NegativeCategoryId.ExcessiveProfanity]: 15,
  [NegativeCategoryId.AccountTheft]: 20,
  [NegativeCategoryId.TrollingAbuse]: 20,
  [NegativeCategoryId.CheatSuspected]: 25,
};

// W_diversity: 지금까지 target에게 칭찬한 고유 유저 수별 배수 (다양한 유저에게 받을수록 강화)
const W_DIVERSITY_TABLE: Record<number, number> = {
  1: 1.0,
  2: 1.2,
  3: 1.35,
};
const W_DIVERSITY_4_OR_MORE = 1.5;

// W_relation: 동일 유저가 이 target에게 N번째 칭찬 (반복 시 가중치 감소)
const W_RELATION_TABLE: Record<number, number> = {
  1: 1.0,
  2: 0.9,
  3: 0.75,
};
const W_RELATION_4_OR_MORE = 0.6;

// W_time: 경기 종료 후 피드백 입력까지 경과 시간(분)
const W_TIME_INVALID_MINUTES = 15; // 0~15분: 무효화 (감정/보복/담합 가능성)
const W_TIME_NORMAL_MAX_MINUTES = 24 * 60; // 15분~24h: 1.0
const W_TIME_LATE = 0.8; // 24h 이상: 0.8 (옵션)

// ---------------------------------------------------------------------------
// 칭찬 가중치 (점수 올릴 때만 사용)
// ---------------------------------------------------------------------------

/**
 * W_diversity: 지금까지 target에게 칭찬한 고유 유저 수에 따른 배수
 */
export function getWDiversity(uniqueGiverCount: number): number {
  if (uniqueGiverCount <= 0) return 0;
  return W_DIVERSITY_TABLE[uniqueGiverCount] ?? W_DIVERSITY_4_OR_MORE;
}

/**
 * W_relation: 동일 유저가 이 target에게 N번째로 남긴 칭찬 (1=첫번째)
 */
export function getWRelation(sameGiverCount: number): number {
  if (sameGiverCount <= 0) return 0;
  return W_RELATION_TABLE[sameGiverCount] ?? W_RELATION_4_OR_MORE;
}

/**
 * W_time: 경기 종료 시각으로부터 피드백 입력까지 경과 분
 * 0~15분: 0(무효), 15분~24h: 1.0, 24h~: 0.8
 */
export function getWTime(minutesSinceGameEnd: number): number {
  if (minutesSinceGameEnd < W_TIME_INVALID_MINUTES) return 0;
  if (minutesSinceGameEnd <= W_TIME_NORMAL_MAX_MINUTES) return 1.0;
  return W_TIME_LATE;
}

/** 칭찬 한 건의 유효 점수 (W_relation × W_time × W_diversity) */
export function computePraiseScoreWithWeights(
  basePoints: number,
  sameGiverCount: number,
  minutesSinceGameEnd: number,
  uniqueGiverCount: number,
): number {
  const wRelation = getWRelation(sameGiverCount);
  const wTime = getWTime(minutesSinceGameEnd);
  const wDiversity = getWDiversity(uniqueGiverCount);
  return Math.round(basePoints * wRelation * wTime * wDiversity);
}

/** 부정 카테고리 중 제일 높은 감점 하나만 반영 */
export function getMaxNegativePenalty(categoryIds: number[]): number {
  if (categoryIds.length === 0) return 0;
  return Math.max(
    ...categoryIds.map((id) => NEGATIVE_PENALTIES[id as NegativeCategoryId] ?? 15),
  );
}

// ---------------------------------------------------------------------------
// 점수 올리기 / 내리기
// ---------------------------------------------------------------------------

/**
 * 보호구간: 변동량 절반만 반영
 * - 올라가는 경우 (delta > 0): 95점 이상일 때만 절반 반영
 * - 내려가는 경우 (delta < 0): 60점 이하일 때만 절반 반영
 */
export function applyProtectionZone(currentTs: number, delta: number): number {
  if (delta > 0 && currentTs >= PROTECTION_HIGH) {
    // 올라가는 경우: 95점 이상일 때만 절반 반영
    return delta * 0.5;
  }
  if (delta < 0 && currentTs <= PROTECTION_LOW) {
    // 내려가는 경우: 60점 이하일 때만 절반 반영
    return delta * 0.5;
  }
  return delta;
}

/**
 * 피드백 한 건 반영 후 새 TS 계산 (Feedback.tsScoreChange 한 건)
 * @param currentTs - 현재 TemperScore
 * @param tsScoreChange - 변화량 (양수면 올라감, 음수면 내려감)
 * @returns 0~100 범위의 새 TS (보호구간 적용)
 */
export function computeNewTemperScoreAfterFeedback(
  currentTs: number,
  tsScoreChange: number,
  options: { applyProtection?: boolean } = {},
): number {
  const { applyProtection = true } = options;

  let delta = tsScoreChange;
  if (applyProtection) {
    delta = applyProtectionZone(currentTs, delta);
  }

  let next = currentTs + delta;
  if (next < TS_MIN) next = TS_MIN;
  if (next > TS_MAX) next = TS_MAX;
  return Math.round(next);
}
