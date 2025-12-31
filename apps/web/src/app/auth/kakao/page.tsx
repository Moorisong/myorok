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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full mx-4 border border-emerald-100">
          <div className="flex flex-col items-center">
            {/* Error Icon with Animation */}
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              로그인 실패
            </h1>

            {/* Error Message */}
            <div className="bg-red-50 rounded-xl p-4 mb-6 w-full">
              <p className="text-red-700 text-center text-sm leading-relaxed">
                {error}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => window.close()}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              닫기
            </button>

            {/* Decorative Elements */}
            <div className="mt-6 flex gap-2">
              <div className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-green-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full mx-4 border border-emerald-100">
        <div className="flex flex-col items-center">
          {/* Cat Paw Loading Animation */}
          <div className="relative w-24 h-24 mb-8">
            {/* Main Spinner */}
            <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>

            {/* Cat Paw Icon in Center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-12 h-12 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4-2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-3">
            로그인 중...
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600 text-center leading-relaxed mb-6">
            카카오 계정으로 로그인하고 있습니다.
            <br />
            <span className="text-emerald-600 font-semibold">잠시만 기다려주세요</span> 🐾
          </p>

          {/* Progress Dots */}
          <div className="flex gap-2 mt-2">
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KakaoAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full mx-4 border border-emerald-100">
            <div className="flex flex-col items-center">
              {/* Loading Spinner */}
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                로딩 중...
              </h1>

              {/* Progress Dots */}
              <div className="flex gap-2 mt-4">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <KakaoAuthContent />
    </Suspense>
  );
}
