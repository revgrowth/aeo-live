import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'AEO.LIVE - Competitive Intelligence Platform',
    description:
        'Analyze SEO health, Answer Engine Optimization readiness, and brand voice differentiation against your competitors.',
    keywords: ['SEO', 'AEO', 'competitive analysis', 'brand voice', 'content optimization'],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans antialiased`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
