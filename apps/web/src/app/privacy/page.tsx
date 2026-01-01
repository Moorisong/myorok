import type { Metadata } from "next";
import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "개인정보처리방침 - 묘록",
  description: "묘록 개인정보처리방침",
};

export default function PrivacyPolicy() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>묘록 개인정보처리방침</h1>
          <p className={styles.date}>시행일: 2026년 1월 1일</p>
        </header>

        <section className={styles.section}>
          <h2>제1조 (개요)</h2>
          <p>
            묘록(이하 "서비스")은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」,
            「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수하고 있습니다.
          </p>
          <p>
            본 개인정보처리방침은 서비스가 수집하는 개인정보의 항목, 수집 및 이용 목적,
            보유 및 이용 기간, 파기 절차 등에 관한 사항을 안내합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>제2조 (수집하는 개인정보 항목)</h2>
          <p>서비스는 최소한의 정보만을 수집하며, 다음과 같은 정보를 처리합니다:</p>

          <h3>1. 필수 수집 정보</h3>
          <ul>
            <li><strong>기기 식별 정보</strong>: 기기 고유 ID (익명화된 UUID)</li>
            <li><strong>서비스 이용 기록</strong>: 접속 로그, 쿨타임 관리를 위한 작성 시간</li>
          </ul>

          <h3>2. 선택 수집 정보</h3>
          <ul>
            <li><strong>푸시 알림 토큰</strong>: 알림 기능 사용 시 (선택사항)</li>
            <li><strong>클라우드 백업 데이터</strong>: 백업 기능 사용 시 (선택사항)</li>
          </ul>

          <h3>3. 자동 수집 정보</h3>
          <ul>
            <li><strong>앱 사용 정보</strong>: 앱 버전, OS 버전</li>
            <li><strong>쉼터 활동 정보</strong>: 게시글, 댓글, 좋아요 (익명 처리)</li>
          </ul>

          <p className={styles.highlight}>
            ※ 서비스는 이메일, 전화번호, 주소 등의 개인 식별 정보 및 신용카드 번호 등 결제 정보를 직접 수집하지 않습니다. 결제 정보는 앱 마켓(Google Play Store)에서 처리합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>제3조 (개인정보의 수집 및 이용 목적)</h2>
          <p>수집한 개인정보는 다음의 목적을 위해 활용됩니다:</p>

          <ol>
            <li><strong>서비스 제공</strong>
              <ul>
                <li>반려묘 건강 기록 관리</li>
                <li>데이터 차트 및 통계 제공</li>
                <li>쉼터(커뮤니티) 기능 제공</li>
              </ul>
            </li>
            <li><strong>서비스 개선</strong>
              <ul>
                <li>이용자 피드백 수집 및 분석</li>
                <li>버그 수정 및 서비스 안정화</li>
              </ul>
            </li>
            <li><strong>부정 이용 방지</strong>
              <ul>
                <li>도배, 스팸 방지</li>
                <li>쿨타임 관리 (글쓰기 1시간 제한, 댓글 도배 방지)</li>
              </ul>
            </li>
            <li><strong>푸시 알림 발송</strong> (선택 동의 시)
              <ul>
                <li>댓글 알림</li>
                <li>서비스 공지사항</li>
              </ul>
            </li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2>제4조 (개인정보의 보유 및 이용 기간)</h2>

          <h3>1. 기본 원칙</h3>
          <p>
            개인정보는 수집 및 이용 목적이 달성된 후에는 지체 없이 파기합니다.
            다만, 관련 법령에 따라 보존할 필요가 있는 경우에는 해당 기간 동안 보관합니다.
          </p>

          <h3>2. 보유 기간</h3>
          <ul>
            <li><strong>기기 정보</strong>: 서비스 이용 중 (앱 삭제 시 즉시 삭제 가능)</li>
            <li><strong>건강 기록 데이터</strong>: 이용자가 직접 삭제할 때까지 보관</li>
            <li><strong>쉼터 게시글</strong>: 매일 자정(KST) 자동 삭제</li>
            <li><strong>푸시 알림 기록</strong>: 발송 후 10일 자동 삭제</li>
            <li><strong>클라우드 백업 데이터</strong>: 최대 30일 보관 (이후 자동 삭제)</li>
          </ul>

          <h3>3. 법령에 따른 보존</h3>
          <p>관련 법령에 따라 다음의 정보는 명시된 기간 동안 보존됩니다:</p>
          <ul>
            <li>소비자 불만 또는 분쟁 처리 기록: 3년 (전자상거래법)</li>
            <li>서비스 이용 관련 부정 이용 기록: 1년</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>제5조 (개인정보의 제3자 제공)</h2>
          <p>
            서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
            다만, 다음의 경우는 예외로 합니다:
          </p>
          <ol>
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라
              수사기관의 요구가 있는 경우</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2>제6조 (개인정보의 파기 절차 및 방법)</h2>

          <h3>1. 파기 절차</h3>
          <p>
            이용자의 개인정보는 목적 달성 후 내부 방침 및 관련 법령에 따라
            일정 기간 저장된 후 파기됩니다.
          </p>

          <h3>2. 파기 방법</h3>
          <ul>
            <li><strong>전자 파일</strong>: 복구 불가능한 방법으로 영구 삭제</li>
            <li><strong>데이터베이스</strong>: 데이터 삭제 쿼리 실행 후 백업 데이터에서도 제거</li>
          </ul>

          <h3>3. 이용자 주도 삭제</h3>
          <p>이용자는 언제든지 다음의 방법으로 데이터를 삭제할 수 있습니다:</p>
          <ul>
            <li>앱 내 설정에서 데이터 전체 삭제</li>
            <li>앱 삭제 (기기 내 데이터 자동 삭제)</li>
            <li>선택적 데이터 삭제 (건강 기록 중 일부만 삭제)</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>제7조 (개인정보 보호를 위한 기술적·관리적 대책)</h2>

          <h3>1. 기술적 보호 조치</h3>
          <ul>
            <li><strong>데이터 암호화</strong>: 클라우드 백업 데이터는 암호화하여 저장</li>
            <li><strong>익명화 처리</strong>: 쉼터 기능은 익명 닉네임으로 운영</li>
            <li><strong>보안 연결</strong>: HTTPS 통신으로 데이터 전송 보호</li>
          </ul>

          <h3>2. 관리적 보호 조치</h3>
          <ul>
            <li>개인정보에 대한 접근 권한 최소화</li>
            <li>정기적인 보안 점검 실시</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>제8조 (이용자의 권리와 행사 방법)</h2>
          <p>이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다:</p>

          <ol>
            <li><strong>개인정보 열람 요구</strong>
              <ul>
                <li>앱 내에서 본인의 건강 기록 및 백업 데이터 확인 가능</li>
              </ul>
            </li>
            <li><strong>개인정보 정정·삭제 요구</strong>
              <ul>
                <li>앱 내 설정에서 직접 수정 및 삭제 가능</li>
              </ul>
            </li>
            <li><strong>개인정보 처리 정지 요구</strong>
              <ul>
                <li>앱 삭제 시 모든 처리 정지</li>
              </ul>
            </li>
          </ol>

          <p>
            권리 행사는 앱 내 기능을 통해 직접 수행하거나,
            아래 문의처로 연락 주시면 지체 없이 조치하겠습니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>제9조 (개인정보 보호책임자)</h2>
          <p>
            서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고,
            개인정보 처리와 관련한 이용자의 불만 처리 및 피해구제를 위하여
            아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </p>

          <div className={styles.contactBox}>
            <h3>개인정보 보호책임자</h3>
            <p><strong>이메일</strong>: thiagooo@naver.com</p>
            <p>
              개인정보 관련 문의, 불만 처리, 피해 구제 등에 관한 사항을
              개인정보 보호책임자에게 문의하실 수 있습니다.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>제10조 (개인정보처리방침의 변경)</h2>
          <p>
            본 개인정보처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용의 추가,
            삭제 및 수정이 있을 시에는 변경 사항의 시행 7일 전부터 앱 내 공지사항을 통해 고지할 것입니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>제11조 (추가 안내)</h2>

          <h3>데이터 최소 수집 원칙</h3>
          <p>
            묘록은 개인 식별이 가능한 정보(이메일, 전화번호, 이름 등)를 수집하지 않으며,
            서비스 제공에 필요한 최소한의 정보만 처리합니다.
          </p>

          <h3>쉼터(커뮤니티) 익명성</h3>
          <p>
            쉼터 기능은 완전 익명으로 운영되며, 기기 ID를 기반으로 생성된
            랜덤 닉네임으로 활동합니다. 실명이나 개인정보는 노출되지 않습니다.
          </p>

          <h3>로컬 우선 저장</h3>
          <p>
            건강 기록 데이터는 기본적으로 이용자의 기기에 저장되며,
            클라우드 백업은 선택사항입니다.
          </p>
        </section>

        <footer className={styles.footer}>
          <p>본 개인정보처리방침은 2026년 1월 1일부터 시행됩니다.</p>
          <p className={styles.footerLink}>
            <a href="/partial-delete">선택적 데이터 삭제 안내 &rarr;</a>
          </p>
        </footer>
      </main>
    </div >
  );
}
