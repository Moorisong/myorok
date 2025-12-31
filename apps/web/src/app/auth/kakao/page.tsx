'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function KakaoAuthContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleKakaoAuth = async () => {
      try {
        // Get the authorization code from URL
        const code = searchParams.get('code');

        if (!code) {
          setError('인증 코드가 없습니다. 다시 시도해주세요.');
          setLoading(false);
          return;
        }

        // Exchange code for JWT token
        const response = await fetch('/api/auth/kakao', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || '로그인에 실패했습니다.');
        }

        const data = await response.json();

        if (!data.token || !data.user) {
          throw new Error('토큰 또는 사용자 정보를 받지 못했습니다.');
        }

        // Redirect to app with deep link (token + user info)
        const userInfo = encodeURIComponent(JSON.stringify(data.user));
        const deepLink = `myorok://?token=${encodeURIComponent(data.token)}&user=${userInfo}`;
        console.log('Redirecting to app with user info');
        window.location.href = deepLink;

        // Keep loading state as we're redirecting
        setLoading(true);
      } catch (err) {
        console.error('Kakao auth error:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    handleKakaoAuth();
  }, [searchParams]);

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#FFFFFF', textAlign: 'center' }}
      >
        <div style={{ width: 80, height: 80, marginBottom: 24 }}>
          <img
            src="/myorok_logo_small.png"
            alt="Myorok Logo"
            className="w-full h-full object-contain opacity-50 grayscale"
            style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.5, filter: 'grayscale(100%)' }}
          />
        </div>

        <h1
          className="text-[20px] font-bold text-[#2E2E2E] mb-3 text-center"
          style={{ fontSize: 20, fontWeight: 'bold', color: '#2E2E2E', marginBottom: 12, textAlign: 'center' }}
        >
          로그인에 실패했어요
        </h1>

        <p
          className="text-[#4A4A4A] text-[15px] mb-8 leading-relaxed max-w-xs mx-auto text-center"
          style={{ fontSize: 15, color: '#4A4A4A', marginBottom: 40, lineHeight: 1.6, maxWidth: 320, margin: '0 auto 40px auto', textAlign: 'center' }}
        >
          {error}
        </p>

        <button
          onClick={() => window.close()}
          className="px-8 py-3 bg-[#6B6B6B] hover:bg-[#555555] text-white rounded-[12px] font-medium transition-colors"
          style={{ marginTop: 24, padding: '12px 32px', backgroundColor: '#6B6B6B', color: '#FFFFFF', borderRadius: 12, fontWeight: 500, border: 'none', cursor: 'pointer' }}
        >
          닫기
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#FFFFFF', textAlign: 'center' }}
    >
      <div className="animate-pulse" style={{ width: 80, height: 80, marginBottom: 32 }}>
        <img
          src="/myorok_logo_small.png"
          alt="Myorok Logo"
          className="w-full h-full object-contain"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      <h1
        className="text-[24px] font-bold text-[#2E2E2E] mb-3 tracking-tight text-center"
        style={{ fontSize: 24, fontWeight: 'bold', color: '#2E2E2E', marginBottom: 12, textAlign: 'center' }}
      >
        로그인 중...
      </h1>

      <p
        className="text-[#4A4A4A] text-[15px] leading-relaxed font-medium text-center"
        style={{ fontSize: 15, color: '#4A4A4A', lineHeight: 1.6, fontWeight: 500, textAlign: 'center' }}
      >
        잠시만 기다려주세요<br />
        앱으로 이동합니다 🐾
      </p>
    </div>
  );
}

export default function KakaoAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
          <div className="w-10 h-10 border-4 border-[#5DB075] border-t-transparent rounded-full animate-spin" style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #E0E0E0', borderTopColor: '#5DB075', animation: 'spin 1s linear infinite' }}></div>
        </div>
      }
    >
      <KakaoAuthContent />
    </Suspense>
  );
}
