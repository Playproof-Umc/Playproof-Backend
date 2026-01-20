// src/modules/azit/utils/azit.util.ts

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
 * @param cursor - 커서 문자열 (game_start_at|schedule_id 형식)
 * @returns 파싱된 게임 시작 시간과 일정 ID
 */
export function parseScheduleCursor(cursor: string): {
  gameStartAt: Date;
  scheduleId: bigint;
} {
  const [gameStartAtStr, scheduleIdStr] = cursor.split('|');

  return {
    gameStartAt: new Date(gameStartAtStr),
    scheduleId: BigInt(scheduleIdStr),
  };
}
