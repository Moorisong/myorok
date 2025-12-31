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
        // Use root path instead of /login to avoid routing issues
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">로그인 실패</h1>
            <p className="text-gray-600 text-center mb-6">{error}</p>
            <button
              onClick={() => window.close()}
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition-colors duration-200"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 border-4 border-yellow-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-yellow-400 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">로그인 중...</h1>
          <p className="text-gray-600 text-center">
            카카오 계정으로 로그인하고 있습니다.
            <br />
            잠시만 기다려주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function KakaoAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-yellow-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-yellow-400 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">로딩 중...</h1>
            </div>
          </div>
        </div>
      }
    >
      <KakaoAuthContent />
    </Suspense>
  );
}
