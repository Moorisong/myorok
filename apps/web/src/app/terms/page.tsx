import type { Metadata } from "next";
import styles from "./terms.module.css";

export const metadata: Metadata = {
  title: "이용약관 - 묘록",
  description: "묘록 서비스 이용약관",
};

export default function TermsOfService() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>묘록 서비스 이용약관</h1>
          <p className={styles.date}>시행일: 2025년 1월 1일</p>
        </header>

        <section className={styles.section}>
          <h2>제1조 (목적)</h2>
          <p>
            본 약관은 묘록(이하 "서비스")이 제공하는 반려묘 건강 기록 관리 서비스의 이용과 관련하여
            서비스와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>제2조 (정의)</h2>
          <ol>
            <li>"서비스"란 묘록이 제공하는 반려묘 건강 기록, 차트, 쉼터(커뮤니티) 등 모든 기능을 의미합니다.</li>
            <li>"이용자"란 본 약관에 따라 서비스를 이용하는 모든 사용자를 의미합니다.</li>
            <li>"기기"란 이용자가 서비스를 이용하기 위해 사용하는 스마트폰, 태블릿 등 모바일 기기를 의미합니다.</li>
            <li>"건강 기록"이란 이용자가 서비스를 통해 입력하는 반려묘의 배변, 구토, 식수량, 영양제 섭취 등의 정보를 의미합니다.</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2>제3조 (약관의 효력 및 변경)</h2>
          <ol>
            <li>본 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.</li>
            <li>서비스는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있으며,
                변경된 약관은 앱 내 공지 또는 이메일을 통해 공지합니다.</li>
            <li>이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2>제4조 (서비스의 제공)</h2>
          <ol>
            <li>서비스는 다음과 같은 기능을 제공합니다:
              <ul>
                <li>반려묘 건강 기록 (배변, 구토, 식수량, 영양제 등)</li>
                <li>건강 데이터 차트 및 분석</li>
                <li>달력 기반 기록 조회</li>
                <li>쉼터 (커뮤니티) 기능</li>
                <li>클라우드 백업 및 복원</li>
                <li>여러 마리 고양이 관리</li>
              </ul>
            </li>
            <li>서비스는 연중무휴 1일 24시간 제공함을 원칙으로 합니다. 다만, 시스템 점검, 서버 장애 등
                부득이한 사유가 있는 경우 서비스의 전부 또는 일부를 일시 중단할 수 있습니다.</li>
            <li>서비스는 필요한 경우 서비스의 내용을 변경하거나 추가할 수 있습니다.</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2>제5조 (데이터 저장 및 관리)</h2>
          <ol>
            <li>이용자가 입력한 건강 기록 데이터는 기본적으로 이용자의 기기에 저장됩니다.</li>
            <li>클라우드 백업 기능을 이용하는 경우, 데이터는 암호화되어 서버에 저장됩니다.</li>
            <li>서비스는 이용자의 데이터를 제3자에게 제공하지 않으며, 오직 서비스 제공 목적으로만 사용합니다.</li>
            <li>기기에 저장된 데이터는 앱 삭제 시 함께 삭제될 수 있으므로, 이용자는 백업 기능을 활용할 것을 권장합니다.</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2>제6조 (쉼터 커뮤니티 이용 규칙)</h2>
          <ol>
            <li>쉼터는 반려묘 집사들이 서로 위로와 공감을 나누는 공간입니다.</li>
            <li>이용자는 다음 행위를 하여서는 안 됩니다:
              <ul>
                <li>타인을 비방하거나 명예를 훼손하는 행위</li>
                <li>음란물, 폭력적이거나 혐오스러운 내용 게시</li>
                <li>상업적 광고 또는 스팸 게시</li>
                <li>타인의 개인정보를 무단으로 수집, 공개하는 행위</li>
                <li>서비스의 안정적 운영을 방해하는 행위</li>
              </ul>
            </li>
            <li>위 규정을 위반한 게시물은 사전 통보 없이 삭제될 수 있으며,
                반복적인 위반 시 서비스 이용이 제한될 수 있습니다.</li>
            <li>신고가 3회 이상 누적된 게시물은 자동으로 숨김 처리됩니다.</li>
            <li>모든 게시물은 매일 자정(KST 기준)에 자동으로 삭제됩니다.</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2>제7조 (개인정보 보호)</h2>
          <ol>
            <li>서비스는 이용자의 개인정보를 관련 법령에 따라 보호합니다.</li>
            <li>서비스는 익명 기반으로 운영되며, 최소한의 기기 정보만을 수집합니다.</li>
            <li>개인정보의 수집, 이용, 제공, 보관 등에 관한 자세한 사항은 별도의 개인정보처리방침에서 규정합니다.</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2>제8조 (서비스의 책임 제한)</h2>
          <ol>
            <li>서비스는 반려묘의 건강 기록을 돕는 도구일 뿐, 수의학적 진단이나 치료를 제공하지 않습니다.</li>
            <li>반려묘의 건강 상태에 대한 판단이나 치료는 반드시 수의사와 상담하시기 바랍니다.</li>
            <li>서비스는 천재지변, 전쟁, 시스템 장애 등 불가항력적인 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            <li>이용자의 기기 고장, 분실, 네트워크 장애 등으로 인한 데이터 손실에 대해 서비스는 책임을 지지 않습니다.</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2>제9조 (이용자의 의무)</h2>
          <ol>
            <li>이용자는 본 약관 및 관련 법령을 준수하여야 합니다.</li>
            <li>이용자는 본인의 기기 및 계정 정보를 스스로 관리할 책임이 있습니다.</li>
            <li>이용자는 정확하고 최신의 정보를 입력하여야 합니다.</li>
            <li>이용자는 서비스를 불법적인 목적이나 본 약관에 위배되는 방법으로 이용해서는 안 됩니다.</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2>제10조 (서비스 이용의 제한 및 중지)</h2>
          <ol>
            <li>서비스는 이용자가 본 약관을 위반한 경우 경고, 일시 정지, 영구 정지 등의 조치를 취할 수 있습니다.</li>
            <li>서비스는 부득이한 사유로 서비스를 종료할 수 있으며, 이 경우 최소 30일 전에 공지합니다.</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2>제11조 (지적재산권)</h2>
          <ol>
            <li>서비스가 제공하는 모든 콘텐츠, 디자인, 로고 등의 지적재산권은 서비스에 귀속됩니다.</li>
            <li>이용자가 작성한 게시물의 저작권은 이용자에게 있으나,
                서비스는 서비스 운영 및 개선을 위해 이를 사용할 수 있습니다.</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2>제12조 (분쟁 해결)</h2>
          <ol>
            <li>본 약관과 관련하여 분쟁이 발생한 경우, 당사자 간 협의를 통해 해결함을 원칙으로 합니다.</li>
            <li>협의가 이루어지지 않을 경우, 관련 법령 및 대한민국 법률에 따라 해결합니다.</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2>제13조 (문의)</h2>
          <p>
            서비스 이용 관련 문의사항은 아래 이메일로 연락 주시기 바랍니다:
            <br />
            <strong>이메일: thiagooo@naver.com</strong>
          </p>
        </section>

        <footer className={styles.footer}>
          <p>본 약관은 2025년 1월 1일부터 시행됩니다.</p>
        </footer>
      </main>
    </div>
  );
}
