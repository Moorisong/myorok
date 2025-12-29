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
  PET_MANAGEMENT: '고양이 관리',
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
  PET_ADDED: '고양이를 추가했습니다.',
  PET_UPDATED: '고양이 이름을 변경했습니다.',
  PET_DELETED: '고양이를 삭제했습니다.',
  PET_RESTORED: '삭제된 고양이를 복원했습니다.',
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
  ENTER_PET_NAME: '고양이 이름을 입력해주세요.',
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

export const PET_MESSAGES = {
  DELETE_WARNING: '이 고양이의 모든 기록은 유지되지만, 고양이는 목록에서 숨겨집니다. 정말 삭제하시겠습니까?',
  DELETE_LAST_PET_WARNING: '마지막 고양이는 삭제할 수 없습니다.',
  RESTORE_CONFIRM: '이 고양이를 복원하시겠습니까?',
} as const;

export const PIN_MESSAGES = {
  // 상태 메시지
  LOCKED_BANNER: '🔒 설정이 잠겨 있습니다',
  UNLOCK_BUTTON: '잠금 해제',

  // 설정 화면
  PIN_SET_TITLE: 'PIN 설정',
  PIN_SET_DESCRIPTION: '4자리 숫자를 입력하세요',
  PIN_CONFIRM_DESCRIPTION: 'PIN을 다시 입력하세요',
  PIN_MISMATCH: 'PIN이 일치하지 않습니다.',
  PIN_SET_SUCCESS: 'PIN이 설정되었습니다.',
  PIN_REMOVE_SUCCESS: 'PIN이 해제되었습니다.',

  // 잠금 해제
  PIN_VERIFY_TITLE: 'PIN 입력',
  PIN_VERIFY_DESCRIPTION: '설정을 변경하려면 PIN을 입력하세요',

  // 에러
  SERVER_UNAVAILABLE: '서버에 연결할 수 없습니다. 나중에 다시 시도해주세요.',
  INVALID_PIN_FORMAT: 'PIN은 4자리 숫자여야 합니다.',

  // 관리
  PIN_CHANGE: 'PIN 변경',
  PIN_REMOVE: 'PIN 해제',
  PIN_REMOVE_CONFIRM: 'PIN을 해제하시겠습니까? 설정이 잠기지 않게 됩니다.',
} as const;

export const COMFORT_MESSAGES = {
  // 탭 헤더
  TAB_TITLE: '쉼터',
  TAB_SUBTITLE: '사랑과 희망으로 버틴 오늘, 환묘와 나 그리고 우리.',

  // 자정 삭제 안내
  MIDNIGHT_NOTICE: '💫 모든 글은 자정에 사라져요',
  MIDNIGHT_NOTICE_DETAIL: '오늘 하루의 이야기만 나누는 공간입니다',

  // 서버 상태
  SERVER_PREPARING: '서버 준비 중이에요',
  SERVER_PREPARING_DETAIL: '곧 만나요! 조금만 기다려 주세요 🐱',

  // 빈 상태
  EMPTY_STATE: '아직 글이 없어요',
  EMPTY_STATE_DETAIL: '첫 번째 이야기를 나눠보세요!',

  // 글 작성
  COMPOSE_TITLE: '글 쓰기',
  COMPOSE_PLACEHOLDER: '오늘 하루 어떻게 보내고 있나요?\n행복한 이야기, 크고 작은 일들 그리고 위로와 응원을 나누는 공간입니다.',
  COMPOSE_LIMIT: '/500',
  POST_SUCCESS: '글이 등록되었어요',

  // 글 작성 제한
  POST_LIMIT_TITLE: '잠시 쉬어가요',
  POST_LIMIT_MESSAGE: (minutes: number) => `${minutes}분 후에 다시 글을 쓸 수 있어요`,

  // 댓글
  COMMENT_PLACEHOLDER: '따뜻한 댓글을 남겨주세요',
  SHOW_COMMENTS: (count: number) => `댓글 ${count}개 보기`,
  HIDE_COMMENTS: '댓글 접기',
  COMMENT_SUCCESS: '댓글이 등록되었어요',

  // 수정/삭제
  EDIT: '수정',
  DELETE: '삭제',
  DELETE_CONFIRM: '정말 삭제하시겠어요?',
  DELETE_POST_DETAIL: '글과 댓글이 모두 삭제됩니다',
  DELETE_COMMENT_DETAIL: '댓글이 삭제됩니다',

  // 신고/차단
  REPORT: '신고',
  REPORT_REASONS: ['부적절한 내용', '스팸/광고', '욕설 우회', '기타'],
  REPORT_SUCCESS: '신고가 접수되었어요',
  BLOCK: '차단',
  BLOCK_CONFIRM: '이 사용자를 차단하시겠어요?',
  BLOCK_DETAIL: '차단하면 이 사용자의 글과 댓글이 보이지 않아요',
  BLOCK_SUCCESS: '사용자를 차단했어요',
  UNBLOCK: '차단 해제',
  UNBLOCK_SUCCESS: '차단을 해제했어요',

  // 좋아요
  LIKE: '응원해요',
} as const;
