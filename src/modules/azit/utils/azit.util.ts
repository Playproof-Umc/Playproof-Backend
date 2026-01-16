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
