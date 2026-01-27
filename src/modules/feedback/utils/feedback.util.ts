// src/modules/feedback/utils/feedback.util.ts

/**
 * 날짜 포맷팅 유틸리티 (한국 시간으로 변환)
 * @param date - 포맷팅할 날짜
 * @returns "YYYY-MM-DDTHH:mm:ss" 형식의 문자열
 */
export function formatDate(date: Date): string {
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kstDate.toISOString().substring(0, 19);
}

/**
 * 커서 파싱
 * @param cursor - 커서 문자열 (created_at|feedback_id 형식)
 * @returns 파싱된 생성 시간과 피드백 ID
 */
export function parseFeedbackCursor(cursor: string): {
  createdAt: Date;
  feedbackId: bigint;
} {
  const [createdAtStr, idStr] = cursor.split('|');

  return {
    createdAt: new Date(createdAtStr),
    feedbackId: BigInt(idStr),
  };
}
