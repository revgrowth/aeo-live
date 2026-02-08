import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatScore(score: number | null | undefined): string {
    if (score === null || score === undefined) return '--';
    return Math.round(score).toString();
}

export function getScoreColor(score: number): string {
    if (score >= 90) return 'text-score-excellent';
    if (score >= 70) return 'text-score-good';
    if (score >= 50) return 'text-score-fair';
    if (score >= 30) return 'text-score-poor';
    return 'text-score-critical';
}

export function getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 30) return 'Poor';
    return 'Critical';
}
