/**
 * 운영자 판별 유틸리티
 */

/**
 * 카카오 사용자 ID가 운영자인지 확인
 * @param kakaoUserId - 카카오 사용자 ID
 * @returns 운영자 여부
 */
export function isAdminUser(kakaoUserId: string): boolean {
  const admins = process.env.ADMIN_KAKAO_IDS?.split(',') ?? [];
  return admins.includes(kakaoUserId);
}
