export const ALERT_TITLES = {
  ERROR: '오류',
  SAVE_COMPLETE: '저장 완료',
  ALERT: '알림',
  ADD_COMPLETE: '추가 완료',
  DELETE_CONFIRM: '삭제 확인',
  COMPLETE: '완료',
  LOCK_SETTING: '잠금 설정',
  BACKUP: '백업',
  RESTORE: '복원',
} as const;

export const ERROR_MESSAGES = {
  SAVE_FAILED: '저장 중 문제가 발생했습니다.',
  UNDO_FAILED: '실행 취소 중 문제가 발생했습니다.',
  DELETE_FAILED: '삭제 중 문제가 발생했습니다.',
  STATUS_CHANGE_FAILED: '상태 변경 중 문제가 발생했습니다.',
  ADD_FAILED: '추가 중 문제가 발생했습니다.',
  RECORD_FAILED: '기록 중 문제가 발생했습니다.',
  INVALID_NUMBER: '올바른 숫자를 입력해주세요.',
} as const;

export const SUCCESS_MESSAGES = {
  SAVED: '메모가 저장되었습니다.',
  TODAY_SAVED: '오늘의 기록이 저장되었습니다.',
  FLUID_SAVED: '수액 기록이 저장되었습니다.',
  FOOD_SAVED: '사료 기호성이 기록되었습니다.',
  HOSPITAL_SAVED: '병원 방문 기록이 저장되었습니다.',
  METRIC_SAVED: '수치가 기록되었습니다.',
} as const;

export const VALIDATION_MESSAGES = {
  SELECT_TYPE: '수액 종류를 선택해주세요.',
  SELECT_FOOD: '사료 종류와 기호성을 선택해주세요.',
  ENTER_NAME: '이름을 입력해주세요.',
  ENTER_DATE: '날짜를 입력해주세요.',
  ENTER_VALUE: '값을 입력해주세요.',
  SELECT_METRIC: '기록할 수치 항목을 선택해주세요.',
  SELECT_ITEM: '항목을 선택해주세요.',
  ENTER_METRIC_NAME: '새로운 수치 이름을 입력해주세요.',
  ENTER_ITEM_NAME: '항목 이름을 입력해주세요.',
  ENTER_NUMBER: '수치를 입력해주세요.',
} as const;

export const UI_LABELS = {
  LOADING: '로딩 중...',
  SAVE_BUTTON: '저장하기',
  ADD_BUTTON: '추가',
  CANCEL_BUTTON: '취소',
} as const;

export const PLACEHOLDERS = {
  MEMO: '오늘의 특이사항을 기록하세요',
  MEMO_TODAY: '특이사항을 입력하세요',
} as const;

export const TOAST_MESSAGES = {
  PEE_RECORDED: '소변 기록 완료. 실행 취소?',
  POOP_RECORDED: '배변 기록 완료. 실행 취소?',
  DIARRHEA_RECORDED: '묽은 변 기록 완료. 실행 취소?',
} as const;

export const FUTURE_FEATURES = {
  LOCK: '잠금 기능은 추후 업데이트에서 제공될 예정입니다.',
  BACKUP: '백업 기능은 추후 업데이트에서 제공될 예정입니다.',
  RESTORE: '복원 기능은 추후 업데이트에서 제공될 예정입니다.',
} as const;
