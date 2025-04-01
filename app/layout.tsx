import type { Metadata } from 'next';
import { Monomaniac_One } from 'next/font/google';
import './globals.css';

const monomaniacOne = Monomaniac_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-monomaniac-one',
});

export const metadata: Metadata = {
  title: 'Ali Trello',
  description: 'This a fullstack trello clone',
  icons: {
    icon: {
      url: '/icon-sun.svg',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${monomaniacOne.variable}`}>{children}</body>
    </html>
  );
}
