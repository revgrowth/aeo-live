import type { Metadata } from 'next';
import { Inter, DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const dmSans = DM_Sans({
    subsets: ['latin'],
    weight: ['300', '500', '700', '800'],
    variable: '--font-dm-sans',
});
const dmMono = DM_Mono({
    subsets: ['latin'],
    weight: ['400', '500'],
    variable: '--font-dm-mono',
});

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
            <body className={`${inter.variable} ${dmSans.variable} ${dmMono.variable} font-sans antialiased`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
