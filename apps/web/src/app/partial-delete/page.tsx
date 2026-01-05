import type { Metadata } from "next";
import styles from "./partial-delete.module.css";

export const metadata: Metadata = {
  title: "선택적 데이터 삭제 안내 - 묘록",
  description: "묘록 선택적 데이터 삭제 방법 안내",
};

export default function PartialDeleteGuide() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>선택적 데이터 삭제 안내</h1>
          <p className={styles.subtitle}>
            묘록에서는 이용자가 원하는 데이터만 선택하여 삭제할 수 있습니다
          </p>
        </header>

        <section className={styles.section}>
          <h2>📋 삭제 가능한 데이터 유형</h2>
          <p>묘록 앱에서는 다음과 같은 데이터를 선택적으로 삭제할 수 있습니다:</p>

          <div className={styles.dataTypeGrid}>
            <div className={styles.dataTypeCard}>
              <div className={styles.cardIcon}>📝</div>
              <h3>건강 기록</h3>
              <p>특정 날짜의 배변, 구토, 식수량, 영양제 기록</p>
            </div>

            <div className={styles.dataTypeCard}>
              <div className={styles.cardIcon}>🐱</div>
              <h3>반려묘 정보</h3>
              <p>등록된 고양이 프로필 및 관련 데이터</p>
            </div>

            <div className={styles.dataTypeCard}>
              <div className={styles.cardIcon}>💬</div>
              <h3>쉼터 활동</h3>
              <p>작성한 게시글 및 댓글 (자동 삭제됨)</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>🗑️ 데이터 삭제 방법</h2>

          <div className={styles.methodCard}>
            <h3>1. 개별 건강 기록 삭제</h3>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNumber}>1</span>
                <p>오늘 탭에서 삭제하고 싶은 기록 항목을 길게 누릅니다</p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>2</span>
                <p>삭제 옵션을 선택합니다</p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>3</span>
                <p>확인 메시지에서 "삭제"를 눌러 완료합니다</p>
              </div>
            </div>
            <p className={styles.note}>
              💡 <strong>실행 취소</strong>: 삭제 후 3초 이내에 "실행 취소" 버튼을 눌러 복구할 수 있습니다.
            </p>
          </div>

          <div className={styles.methodCard}>
            <h3>2. 특정 날짜 전체 데이터 삭제</h3>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNumber}>1</span>
                <p>달력 탭에서 삭제하려는 날짜를 선택합니다</p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>2</span>
                <p>우측 상단의 "⋯" (더보기) 메뉴를 탭합니다</p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>3</span>
                <p>"이 날짜 기록 삭제"를 선택합니다</p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>4</span>
                <p>확인 후 삭제를 진행합니다</p>
              </div>
            </div>
          </div>

          <div className={styles.methodCard}>
            <h3>3. 반려묘 프로필 삭제</h3>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNumber}>1</span>
                <p>설정 탭 → "고양이 관리"를 선택합니다</p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>2</span>
                <p>삭제하려는 고양이를 선택합니다</p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>3</span>
                <p>"고양이 삭제" 버튼을 탭합니다</p>
              </div>
            </div>
            <p className={styles.warning}>
              ⚠️ <strong>주의</strong>: 고양이를 삭제하면 해당 고양이의 모든 건강 기록도 함께 삭제됩니다.
              이 작업은 되돌릴 수 없으니 신중히 선택해 주세요.
            </p>
          </div>

          <div className={styles.methodCard}>
            <h3>4. 현재 고양이 데이터 초기화</h3>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNumber}>1</span>
                <p>설정 탭으로 이동합니다</p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>2</span>
                <p>하단의 "데이터 초기화" 항목을 탭합니다</p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>3</span>
                <p>경고 메시지를 확인하고 "확인" 버튼을 탭합니다</p>
              </div>
            </div>
            <p className={styles.warning}>
              ⚠️ <strong>복구 불가능</strong>: 데이터 초기화 시 현재 선택된 고양이의 모든 건강 기록이 영구 삭제됩니다.
              다른 고양이의 기록은 영향을 받지 않으며, 구독 상태도 유지됩니다. 삭제된 데이터는 복구할 수 없으니 신중하게 결정해 주세요.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>🔄 자동 삭제되는 데이터</h2>
          <p>다음 데이터는 자동으로 삭제되므로 별도의 조치가 필요 없습니다:</p>

          <div className={styles.autoDeleteList}>
            <div className={styles.autoDeleteItem}>
              <div className={styles.autoDeleteIcon}>💬</div>
              <div>
                <h4>쉼터 게시글</h4>
                <p>매일 자정(KST) 자동 삭제</p>
              </div>
            </div>

            <div className={styles.autoDeleteItem}>
              <div className={styles.autoDeleteIcon}>🔔</div>
              <div>
                <h4>푸시 알림 기록</h4>
                <p>발송 후 10일 경과 시 자동 삭제</p>
              </div>
            </div>

            <div className={styles.autoDeleteItem}>
              <div className={styles.autoDeleteIcon}>☁️</div>
              <div>
                <h4>오래된 백업 데이터</h4>
                <p>30일 이상 경과한 백업 자동 삭제</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>❓ 자주 묻는 질문</h2>

          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h4>Q. 삭제한 데이터를 복구할 수 있나요?</h4>
              <p>
                A. 개별 기록 삭제 시 3초 이내에 "실행 취소"를 누르면 복구할 수 있습니다.
                그 외의 경우, 삭제된 데이터는 복구할 수 없습니다.
                클라우드 백업이 있다면 복원을 통해 이전 상태로 되돌릴 수 있습니다.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h4>Q. 앱을 삭제하면 데이터도 함께 삭제되나요?</h4>
              <p>
                A. 네, 앱을 삭제하면 기기에 저장된 모든 로컬 데이터가 삭제됩니다.
                다만, 클라우드 백업 데이터는 서버에 30일간 보관됩니다.
                앱을 재설치 후 복원 기능을 사용하여 데이터를 복구할 수 있습니다.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h4>Q. 클라우드 백업만 삭제하고 로컬 데이터는 유지할 수 있나요?</h4>
              <p>
                A. 네, 가능합니다. 설정 → 백업 및 복원 → "서버 백업 데이터 삭제"를 통해
                클라우드 백업만 삭제할 수 있으며, 기기의 로컬 데이터는 영향을 받지 않습니다.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h4>Q. 특정 기간의 데이터만 삭제할 수 있나요?</h4>
              <p>
                A. 현재 버전에서는 개별 날짜별로만 삭제 가능합니다.
                여러 날짜의 데이터를 삭제하려면 각 날짜를 선택하여 개별적으로 삭제해야 합니다.
                향후 업데이트에서 기간 선택 삭제 기능을 추가할 예정입니다.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h4>Q. 삭제한 데이터가 정말로 완전히 삭제되나요?</h4>
              <p>
                A. 네, 삭제된 데이터는 데이터베이스에서 영구적으로 제거되며 복구할 수 없습니다.
                개인정보 보호를 위해 백업 데이터에서도 함께 삭제됩니다.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>📞 추가 문의</h2>
          <p>
            데이터 삭제와 관련하여 추가 문의사항이 있으시면 아래로 연락 주세요:
          </p>
          <div className={styles.contactBox}>
            <p><strong>이메일</strong>: thiagooo@naver.com</p>
            <p>영업일 기준 2-3일 이내에 답변드리겠습니다.</p>
          </div>
        </section>

        <footer className={styles.footer}>
          <p className={styles.footerLinks}>
            <a href="/privacy">개인정보처리방침</a>
            <span className={styles.separator}>•</span>
            <a href="/terms">이용약관</a>
          </p>
        </footer>
      </main>
    </div>
  );
}
