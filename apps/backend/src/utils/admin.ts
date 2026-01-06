/**
 * 운영자 판별 유틸리티
 */

/**
 * 카카오 사용자 ID가 운영자인지 확인
 * @param kakaoUserId - 카카오 사용자 ID
 * @returns 운영자 여부
 */
export function isAdminUser(kakaoUserId: string): boolean {
  const adminsStr = process.env.ADMIN_KAKAO_IDS || '';
  const admins = adminsStr.split(',').map(id => id.trim());
  const isAdm = admins.includes(kakaoUserId);
  return isAdm;
}
