import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '묘록 - 아픈 고양이를 위한 기록 케어 앱',
  description: '투약, 증상, 병원 기록을 한 곳에서 쉽고 빠르게. 만성질환 고양이를 돌보는 보호자를 위한 필수 앱.',
  keywords: ['고양이', '반려묘', '병원기록', '투약기록', '증상기록', '만성질환', '묘록', 'Myorok'],
  authors: [{ name: '묘록 팀' }],
  openGraph: {
    title: '묘록 - 아픈 고양이를 위한 기록 케어 앱',
    description: '투약, 증상, 병원 기록을 한 곳에서 쉽고 빠르게. 만성질환 고양이를 돌보는 보호자를 위한 필수 앱.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '묘록',
    url: 'https://myorok.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: '묘록 - 아픈 고양이를 위한 기록 케어 앱',
    description: '투약, 증상, 병원 기록을 한 곳에서 쉽고 빠르게.',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className={notoSansKr.variable}>
        {children}
      </body>
    </html>
  );
}
