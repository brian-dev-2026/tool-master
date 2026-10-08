import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Nav } from '@/components/Nav';
import { ThemeScript } from '@/components/ThemeScript';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tool-Master',
  description: 'Every tool you need. One place.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <Nav />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
