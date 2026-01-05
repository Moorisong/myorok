// apps/mobile/services/licenseChecker.ts

import { activateSubscription, deactivateSubscription } from './subscription';

/**
 * Google Play License Response 타입
 */
export type LicenseResponse =
  | 'LICENSED'          // 유효한 라이선스
  | 'NOT_LICENSED'      // 라이선스 없음
  | 'ERROR_SERVER_FAILURE'  // 서버 오류
  | 'ERROR_NOT_MARKET_MANAGED';  // 마켓 관리 불가

/**
 * License Response 코드에 따른 처리
 * Note: Toast 메시지는 UI 레이어에서 처리하도록 합니다.
 */
export async function handleLicenseResponse(response: LicenseResponse): Promise<void> {
  switch (response) {
    case 'LICENSED':
      // 구독 활성화
      console.log('License valid - activating subscription');
      await activateSubscription(); // state = 'active', isPro=true
      break;

    case 'NOT_LICENSED':
      // 무료 사용자
      console.log('No license - free user');
      await deactivateSubscription(); // state = 'free', isPro=false
      break;

    case 'ERROR_SERVER_FAILURE':
      // 서버 오류 - 재시도 로직
      console.error('License server failure');
      // 기존 state 유지 - DB 업데이트 하지 않음
      break;

    case 'ERROR_NOT_MARKET_MANAGED':
      // 마켓 관리 불가
      console.error('Not market managed');
      // 기존 state 유지
      break;

    default:
      console.error('Unknown license response:', response);
      break;
  }
}

/**
 * 구매 성공 후 License Response 확인
 */
export async function checkLicenseAfterPurchase(): Promise<LicenseResponse> {
  try {
    // 실제로는 Google Play Licensing API를 통해 확인
    // 샌드박스에서는 자동으로 LICENSED 반환
    return 'LICENSED';
  } catch (error) {
    console.error('Failed to check license:', error);
    return 'ERROR_SERVER_FAILURE';
  }
}
