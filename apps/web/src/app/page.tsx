import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.myorok.app&pcampaignid=web_share';

export default function LandingPage() {
  return (
    <main>
      {/* 1. Hero Section */}
      <section className={styles.heroSection} aria-labelledby="hero-title">
        <div className={`${styles.heroDecoration} ${styles.heroDecorationTop}`} aria-hidden="true" />
        <div className={`${styles.heroDecoration} ${styles.heroDecorationBottom}`} aria-hidden="true" />

        <div className={styles.heroContent}>
          <Image
            src="/myorok_logo_big.png"
            alt="묘록 로고"
            width={120}
            height={120}
            priority
            className={styles.heroIcon}
          />

          <h1 id="hero-title" className={styles.heroTitle}>
            <span className={styles.heroTitleAccent}>아픈 고양이</span>를 위한<br />
            기록 케어 앱
          </h1>

          <p className={styles.heroSubtitle}>
            투약 · 증상 · 병원 기록을<br />
            한 곳에서 쉽고 빠르게
          </p>

          <Link
            href={PLAY_STORE_URL}
            className={styles.ctaButton}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Google Play 스토어에서 묘록 설치하기"
          >
            <span>👉 묘록 설치하기</span>
          </Link>
        </div>
      </section>

      {/* 2. Empathy Section */}
      <section className={styles.empathySection} aria-labelledby="empathy-title">
        <div className={styles.sectionContainer}>
          <h2 id="empathy-title" className="sr-only">보호자의 고민</h2>

          <div className={styles.empathyList}>
            <div className={styles.empathyItem}>"약 먹인 시간 기억하시나요?"</div>
            <div className={styles.empathyItem}>"언제부터 증상이 시작됐죠?"</div>
            <div className={styles.empathyItem}>"병원에서 설명하기 어려웠나요?"</div>
          </div>

          <div className={styles.empathyHighlight}>
            <p className={styles.empathyMessage}>
              보호자는 기억해야 할 것이<br />너무 많습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Solution Section */}
      <section className={styles.solutionSection} aria-labelledby="solution-title">
        <div className={styles.sectionContainer}>
          <span className={styles.solutionTag}>SOLUTION</span>

          <h2 id="solution-title" className={styles.solutionText}>
            묘록은<br />
            <b>아픈 고양이 케어 기록</b>을<br />
            쉽게 만듭니다.
          </h2>

          <p className={styles.solutionDesc}>
            복잡한 설정 없이, 지금 바로 시작하세요.<br />
            당신의 기록이 아이를 지킵니다.
          </p>
        </div>
      </section>

      {/* 4. Features Section */}
      <section className={styles.featuresSection} aria-labelledby="features-title">
        <div className={styles.sectionContainer}>
          <h2 id="features-title" className={styles.sectionTitle}>
            빈틈없는 <b>핵심 기능</b>
          </h2>

          <div className={styles.featureGrid}>
            {/* Feature 1 */}
            <article className={styles.featureCard}>
              <span className={styles.featureIcon}>🕒</span>
              <h3 className={styles.featureCardTitle}>투약 기록</h3>
              <p className={styles.featureCardDesc}>
                약 이름, 시간, 메모를 빠르게 기록하고 투약 관리 스트레스를 줄이세요.
              </p>
              <span className={styles.featureCardHighlight}>"약 언제 먹였지?" 해결</span>
            </article>

            {/* Feature 2 */}
            <article className={styles.featureCard}>
              <span className={styles.featureIcon}>🩺</span>
              <h3 className={styles.featureCardTitle}>증상 기록</h3>
              <p className={styles.featureCardDesc}>
                사진과 메모로 간단하게 기록하고 작은 변화도 놓치지 마세요.
              </p>
              <span className={styles.featureCardHighlight}>작은 변화가 큰 신호가 됩니다</span>
            </article>

            {/* Feature 3 */}
            <article className={styles.featureCard}>
              <span className={styles.featureIcon}>🏥</span>
              <h3 className={styles.featureCardTitle}>병원 방문 준비</h3>
              <p className={styles.featureCardDesc}>
                집에서의 기록을 한 곳에 모아, 병원 상담을 훨씬 쉽게 만드세요.
              </p>
              <span className={styles.featureCardHighlight}>가장 든든한 진료 보조</span>
            </article>

            {/* Feature 4: Chart */}
            <article className={styles.featureCard}>
              <span className={styles.featureIcon}>📊</span>
              <h3 className={styles.featureCardTitle}>건강 리포트</h3>
              <p className={styles.featureCardDesc}>
                체중, 음수량, 구토 횟수 등을 차트로 확인하고 건강 흐름을 파악하세요.
              </p>
              <span className={styles.featureCardHighlight}>눈에 보이는 건강 변화</span>
            </article>
          </div>
        </div>
      </section>

      {/* 5. Difference Section */}
      <section className={styles.differenceSection} aria-labelledby="difference-title">
        <div className={styles.sectionContainer}>
          <h2 id="difference-title" className={styles.sectionTitle}>
            왜 <b>묘록</b>인가요?
          </h2>

          <div className={styles.differenceContainer}>
            {/* Old Way */}
            <div className={`${styles.diffBox} ${styles.diffBoxOld}`}>
              <span className={styles.diffLabel}>기존 방식</span>
              <ul className={styles.diffList}>
                <li className={styles.diffItem}><span>📷</span> 사진 앱 → 흩어짐</li>
                <li className={styles.diffItem}><span>📝</span> 메모 앱 → 검색 어려움</li>
                <li className={styles.diffItem}><span>🧠</span> 기억 → 결국 잊어버림</li>
              </ul>
            </div>

            {/* Myorok Way */}
            <div className={`${styles.diffBox} ${styles.diffBoxNew}`}>
              <span className={styles.diffLabel}>묘록</span>
              <ul className={styles.diffList}>
                <li className={styles.diffItem}><span>✅</span> 아픈 고양이 케어 전용</li>
                <li className={styles.diffItem}><span>✅</span> 한 곳에서 통합 관리</li>
                <li className={styles.diffItem}><span>✅</span> 기록으로 얻는 안심</li>
              </ul>
            </div>
          </div>

          <p className={styles.diffMessage}>
            "기억이 아닌 기록으로 돌보기"
          </p>
        </div>
      </section>

      {/* 6. Trust Section */}
      <section className={styles.trustSection} aria-labelledby="trust-title">
        <div className={styles.sectionContainer}>
          <h2 id="trust-title" className={styles.sectionTitle}>
            <b>안심</b>하고 시작하세요
          </h2>

          <div className={styles.trustList}>
            <div className={styles.trustItem}>
              <span className={styles.checkIcon}>✓</span> 누구나 쉬운 시작
            </div>
            <div className={styles.trustItem}>
              <span className={styles.checkIcon}>✓</span> 복잡한 설정 없음
            </div>
            <div className={styles.trustItem}>
              <span className={styles.checkIcon}>✓</span> 부담 없는 간단 기록
            </div>
          </div>

          <p className={styles.trustFinalMsg}>
            기록은 보호자를 안심시킵니다.
          </p>
        </div>
      </section>

      {/* 7. Final CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>
            오늘부터 기록하면<br />
            <b>내일이 훨씬 편해집니다.</b>
          </h2>

          <Link
            href={PLAY_STORE_URL}
            className={styles.ctaButton}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>👉 묘록 설치하기</span>
          </Link>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <span className={styles.footerLogo}>🐱 묘록 Myorok</span>

          <nav className={styles.footerLinks}>
            <Link href={PLAY_STORE_URL} target="_blank" className={styles.footerLink}>Play Store</Link>
            <Link href="/privacy" className={styles.footerLink}>개인정보처리방침</Link>
            <a href="mailto:support@myorok.app" className={styles.footerLink}>문의하기</a>
          </nav>

          <p className={styles.copyright}>© 2026 Myorok. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
