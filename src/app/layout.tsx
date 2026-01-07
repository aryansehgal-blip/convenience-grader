import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ConvenienceGrader - Free Online Health Check for Convenience Stores',
  description: 'Get your free Online Health Grade in 60 seconds. See what\'s hurting your visibility and how to fix it.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
