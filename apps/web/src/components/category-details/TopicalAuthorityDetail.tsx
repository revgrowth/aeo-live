'use client';

import { useState } from 'react';
import {
    Sparkles, AlertTriangle, CheckCircle, Award,
    TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
    Brain, Globe, Network, Layers, Target, Link2, BookOpen,
    Users, Building2, MapPin, Lightbulb, Package, Zap,
    BarChart3, PieChart, Search, ArrowRight, Star
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface SubcategoryData {
    score: number;
    weight: number;
    evidence: string[];
    issues: string[];
}

interface EntityAnalysis {
    entities: {
        people: string[];
        places: string[];
        organizations: string[];
        concepts: string[];
        products: string[];
    };
    entityCount: number;
    entityDensity: number;
    entityRelationships: { entity1: string; entity2: string; relationship: string }[];
}

interface TopicAnalysis {
    primaryTopic: string;
    secondaryTopics: string[];
    topicDepth: number;
    contentGaps: { topic: string; severity: string; recommendation: string }[];
    competitorAdvantages: { topic: string; theirStrength: string; yourWeakness: string }[];
    yourAdvantages: { topic: string; yourStrength: string; theirWeakness: string }[];
}

interface TopicalAuthorityData {
    score: number;
    subcategories: Record<string, SubcategoryData>;
    insights: string[];
    recommendations: string[];
    entityAnalysis?: EntityAnalysis;
    topicAnalysis?: TopicAnalysis;
    authorityLevel?: string;
}

// Content Gap from Claude AI Service
interface TopicGapFromAI {
    topic: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
    competitorCoverage: string;
    yourGap: string;
    recommendation: string;
}

interface ContentGapFromAI {
    topicsMissing: TopicGapFromAI[];
    depthGaps: { area: string; competitorDepth: string; yourDepth: string; recommendation: string }[];
    formatGaps: string[];
    quickWins: string[];
    strategicPriorities: string[];
    gapScore: number;
    executiveSummary: string;
}

// E-E-A-T Signals from backend
interface AuthorInfo {
    name: string;
    bio?: string;
    credentials: string[];
    socialProfiles: string[];
    isVerified: boolean;
}

interface EEATSignals {
    overallScore: number;
    experience: {
        score: number;
        firstPersonNarratives: number;
        caseStudies: number;
        practicalExamples: number;
        beforeAfterContent: boolean;
        clientTestimonials: number;
        evidence: string[];
    };
    expertise: {
        score: number;
        authorsDetected: AuthorInfo[];
        credentialsFound: string[];
        technicalDepth: number;
        specializationClarity: number;
        industryTerminology: number;
        evidence: string[];
    };
    authoritativeness: {
        score: number;
        wikipediaPresence: boolean;
        wikidataEntity: boolean;
        pressmentions: number;
        industryAwards: string[];
        partnerships: string[];
        mediaCoverage: boolean;
        evidence: string[];
    };
    trustworthiness: {
        score: number;
        contactInfoVisible: boolean;
        physicalAddress: boolean;
        phoneNumber: boolean;
        privacyPolicy: boolean;
        termsOfService: boolean;
        secureConnection: boolean;
        reviewsIntegration: boolean;
        bbbRating?: string;
        trustpilotScore?: number;
        transparencyScore: number;
        evidence: string[];
    };
    comparison?: {
        yourEEATScore: number;
        competitorEEATScore: number;
        yourStrengths: string[];
        competitorStrengths: string[];
        recommendations: string[];
    };
}

interface Props {
    yourData: TopicalAuthorityData;
    competitorData: TopicalAuthorityData;
    yourDomain: string;
    competitorDomain: string;
    // NEW: Claude-powered content gap analysis
    contentGapFromAI?: ContentGapFromAI;
    // NEW: E-E-A-T signal analysis
    eeatSignals?: { you: EEATSignals; competitor: EEATSignals };
}

// ============================================
// SUBCATEGORY METADATA
// ============================================
const SUBCATEGORY_CONFIG: Record<string, {
    icon: any;
    label: string;
    description: string;
    whyItMatters: string;
    gradient: string;
    bgGradient: string;
}> = {
    topicCoverage: {
        icon: Layers,
        label: 'Topic Coverage',
        description: 'How comprehensively do you cover your main topic?',
        whyItMatters: 'Deep topic coverage signals expertise to both search engines and AI. Thin content gets outranked.',
        gradient: 'from-teal-500 to-cyan-500',
        bgGradient: 'from-teal-50 to-cyan-50'
    },
    entitySeo: {
        icon: Network,
        label: 'Entity SEO',
        description: 'Named entities detected and interconnected',
        whyItMatters: 'Entities (people, places, organizations, concepts) are how Google understands topics. More entities = stronger topical signals.',
        gradient: 'from-emerald-500 to-teal-500',
        bgGradient: 'from-emerald-50 to-teal-50'
    },
    semanticCohesion: {
        icon: Brain,
        label: 'Semantic Cohesion',
        description: 'How well your content stays on-topic',
        whyItMatters: 'Topically focused content ranks better. Semantic drift confuses search engines about what your page is about.',
        gradient: 'from-cyan-500 to-blue-500',
        bgGradient: 'from-cyan-50 to-blue-50'
    },
    authoritySignals: {
        icon: Award,
        label: 'Authority Signals',
        description: 'E-E-A-T evidence and expertise markers',
        whyItMatters: 'Google rewards Experience, Expertise, Authoritativeness, and Trustworthiness. These signals build ranking power.',
        gradient: 'from-violet-500 to-purple-500',
        bgGradient: 'from-violet-50 to-purple-50'
    },
    internalStructure: {
        icon: Link2,
        label: 'Internal Structure',
        description: 'Site architecture and topical clusters',
        whyItMatters: 'Strong internal linking creates topical clusters that compound ranking power across related content.',
        gradient: 'from-blue-500 to-indigo-500',
        bgGradient: 'from-blue-50 to-indigo-50'
    },
};

// ============================================
// HELPER COMPONENTS
// ============================================

function AuthorityLevelBadge({ level }: { level: string }) {
    const config: Record<string, { gradient: string; icon: any; description: string }> = {
        'Novice': { gradient: 'from-slate-400 to-slate-500', icon: BookOpen, description: 'Building foundational content' },
        'Competent': { gradient: 'from-blue-400 to-blue-500', icon: TrendingUp, description: 'Growing topical presence' },
        'Specialist': { gradient: 'from-emerald-400 to-emerald-500', icon: Target, description: 'Strong topic focus' },
        'Authority': { gradient: 'from-violet-500 to-purple-500', icon: Award, description: 'Recognized expertise' },
        'Expert': { gradient: 'from-amber-500 to-orange-500', icon: Star, description: 'Dominant topic authority' },
    };

    const { gradient, icon: Icon, description } = config[level] || config['Competent'];

    return (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${gradient} text-white shadow-lg`}>
            <Icon className="w-5 h-5" />
            <span className="font-bold">{level}</span>
            <span className="text-white/80 text-sm hidden sm:inline">• {description}</span>
        </div>
    );
}

function AnimatedAuthorityRing({ score, size = 140, isYou = true }: {
    score: number;
    size?: number;
    isYou?: boolean;
}) {
    const radius = (size - 16) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (s: number) => {
        if (s >= 75) return isYou ? '#14b8a6' : '#10b981'; // teal/emerald
        if (s >= 50) return isYou ? '#06b6d4' : '#0ea5e9'; // cyan/sky
        return isYou ? '#f59e0b' : '#f97316'; // amber/orange
    };

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <defs>
                    <linearGradient id={`ring-gradient-${isYou ? 'you' : 'comp'}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={isYou ? '#14b8a6' : '#10b981'} />
                        <stop offset="100%" stopColor={isYou ? '#06b6d4' : '#0ea5e9'} />
                    </linearGradient>
                </defs>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={12}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#ring-gradient-${isYou ? 'you' : 'comp'})`}
                    strokeWidth={12}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                    style={{
                        filter: 'drop-shadow(0 0 8px rgba(20, 184, 166, 0.4))',
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900">{score}</span>
                <span className="text-xs text-slate-500 font-medium">{isYou ? 'YOU' : 'THEM'}</span>
            </div>
        </div>
    );
}

function ComparisonBadge({ diff }: { diff: number }) {
    if (Math.abs(diff) < 3) {
        return (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                <Minus className="w-3 h-3" /> Tied
            </div>
        );
    }
    if (diff > 0) {
        return (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                <TrendingUp className="w-3 h-3" /> +{diff}
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
            <TrendingDown className="w-3 h-3" /> {diff}
        </div>
    );
}

// ============================================
// ENTITY INTELLIGENCE PANEL
// ============================================

function EntityIntelligencePanel({ yourEntities, competitorEntities }: {
    yourEntities?: EntityAnalysis;
    competitorEntities?: EntityAnalysis;
}) {
    const entityTypes = [
        { key: 'concepts', label: 'Concepts', icon: Lightbulb, gradient: 'from-violet-500 to-purple-500' },
        { key: 'organizations', label: 'Organizations', icon: Building2, gradient: 'from-blue-500 to-indigo-500' },
        { key: 'people', label: 'People', icon: Users, gradient: 'from-emerald-500 to-teal-500' },
        { key: 'places', label: 'Places', icon: MapPin, gradient: 'from-amber-500 to-orange-500' },
        { key: 'products', label: 'Products', icon: Package, gradient: 'from-rose-500 to-pink-500' },
    ];

    const yourTotal = yourEntities?.entityCount || 0;
    const compTotal = competitorEntities?.entityCount || 0;

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                    <Network className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">Entity Intelligence Console</h3>
                    <p className="text-slate-400 text-sm">Named entities detected in your content</p>
                </div>
            </div>

            {/* Entity Count Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-teal-500/30">
                    <div className="text-sm text-slate-400 mb-1">Your Entities</div>
                    <div className="text-3xl font-black text-teal-400">{yourTotal}</div>
                    <div className="text-xs text-slate-500 mt-1">
                        Density: {yourEntities?.entityDensity || 0}%
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600">
                    <div className="text-sm text-slate-400 mb-1">Competitor Entities</div>
                    <div className="text-3xl font-black text-slate-300">{compTotal}</div>
                    <div className="text-xs text-slate-500 mt-1">
                        Density: {competitorEntities?.entityDensity || 0}%
                    </div>
                </div>
            </div>

            {/* Entity Type Breakdown */}
            <div className="space-y-3">
                {entityTypes.map(({ key, label, icon: Icon, gradient }) => {
                    const yourCount = (yourEntities?.entities?.[key as keyof typeof yourEntities.entities] || []).length;
                    const compCount = (competitorEntities?.entities?.[key as keyof typeof competitorEntities.entities] || []).length;
                    const maxCount = Math.max(yourCount, compCount, 1);

                    return (
                        <div key={key} className="bg-slate-800/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                                        <Icon className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-sm text-slate-300 font-medium">{label}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-teal-400 font-bold">{yourCount}</span>
                                    <span className="text-slate-500">vs</span>
                                    <span className="text-slate-400">{compCount}</span>
                                </div>
                            </div>
                            <div className="flex gap-1 h-2">
                                <div
                                    className={`rounded-full bg-gradient-to-r from-teal-500 to-cyan-500`}
                                    style={{ width: `${(yourCount / maxCount) * 50}%` }}
                                />
                                <div
                                    className="rounded-full bg-slate-600"
                                    style={{ width: `${(compCount / maxCount) * 50}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Entity Relationships */}
            {(yourEntities?.entityRelationships?.length || 0) > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-700">
                    <h4 className="text-sm font-bold text-slate-300 mb-3">Entity Relationships Detected</h4>
                    <div className="space-y-2">
                        {yourEntities?.entityRelationships?.slice(0, 3).map((rel, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs bg-slate-800/50 p-2 rounded-lg">
                                <span className="text-teal-400 font-medium">{rel.entity1}</span>
                                <ArrowRight className="w-3 h-3 text-slate-500" />
                                <span className="text-slate-400">{rel.relationship}</span>
                                <ArrowRight className="w-3 h-3 text-slate-500" />
                                <span className="text-cyan-400 font-medium">{rel.entity2}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// TOPIC CLUSTER MAP VISUALIZATION
// ============================================

function TopicClusterMap({ yourTopics, competitorTopics, yourScore, competitorScore }: {
    yourTopics?: TopicAnalysis;
    competitorTopics?: TopicAnalysis;
    yourScore: number;
    competitorScore: number;
}) {
    const centerX = 300;
    const centerY = 250;

    const primaryTopic = yourTopics?.primaryTopic || 'Main Topic';
    const secondaryTopics = yourTopics?.secondaryTopics || [];
    const contentGaps = yourTopics?.contentGaps || [];

    // Create nodes with positions
    const createRadialNodes = (items: string[], radius: number, startAngle = 0) => {
        return items.map((item, i) => {
            const angle = startAngle + (i * 2 * Math.PI / Math.max(items.length, 1)) - Math.PI / 2;
            return { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle), label: item, angle };
        });
    };

    const ring1Nodes = createRadialNodes(secondaryTopics.slice(0, 8), 100);
    const outerItems = contentGaps.map(g => g.topic).slice(0, 12);
    const ring2Nodes = createRadialNodes(outerItems.length > 0 ? outerItems : ['Subtopic 1', 'Subtopic 2', 'Subtopic 3', 'Subtopic 4'], 180);

    const getRating = (score: number) => {
        if (score >= 80) return { label: 'EXCELLENT', color: 'text-emerald-400' };
        if (score >= 60) return { label: 'GOOD', color: 'text-teal-400' };
        if (score >= 40) return { label: 'FAIR', color: 'text-amber-400' };
        return { label: 'NEEDS WORK', color: 'text-rose-400' };
    };
    const { label: ratingLabel, color: ratingColor } = getRating(yourScore);

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Topic Cluster Map</h3>
                            <p className="text-slate-400 text-sm">Visual map of your topical authority structure</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-slate-400">Primary</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-teal-500"></div><span className="text-slate-400">Secondary</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-slate-400">Tertiary</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-slate-400">Gap</span></div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row">
                {/* Left Stats Panel */}
                <div className="lg:w-56 p-4 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-700">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-slate-400 text-xs mb-1">Topics</div><div className="text-teal-400 text-xl font-bold">{secondaryTopics.length + 1}</div></div>
                        <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-slate-400 text-xs mb-1">Gaps</div><div className="text-rose-400 text-xl font-bold">{contentGaps.length}</div></div>
                        <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-slate-400 text-xs mb-1">Depth</div><div className="text-amber-400 text-xl font-bold">{yourTopics?.topicDepth || 0}%</div></div>
                        <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-slate-400 text-xs mb-1">Coverage</div><div className="text-emerald-400 text-xl font-bold">{Math.min(100, Math.round(yourScore * 1.1))}%</div></div>
                    </div>

                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                        <div className="text-slate-400 text-xs mb-2">Topic Authority Score</div>
                        <div className="flex items-center gap-3">
                            <div className="relative w-16 h-16">
                                <svg className="w-16 h-16 transform -rotate-90">
                                    <circle cx="32" cy="32" r="28" fill="none" stroke="#334155" strokeWidth="6" />
                                    <circle cx="32" cy="32" r="28" fill="none" stroke="url(#score-gradient-map)" strokeWidth="6" strokeDasharray={`${(yourScore / 100) * 176} 176`} strokeLinecap="round" />
                                    <defs><linearGradient id="score-gradient-map" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14b8a6" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-black text-white">{yourScore}</span></div>
                            </div>
                            <div><div className={`font-bold ${ratingColor}`}>{ratingLabel}</div><div className="text-slate-500 text-xs">out of 100</div></div>
                        </div>
                    </div>

                    <div className="space-y-2 text-xs">
                        {[
                            { label: 'Topic Coverage', score: yourTopics?.topicDepth || 50 },
                            { label: 'Semantic Depth', score: Math.min(100, yourScore + 10) },
                            { label: 'Entity Density', score: Math.max(20, yourScore - 15) },
                            { label: 'Content Gaps', score: Math.max(0, 100 - (contentGaps.length * 15)) },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-slate-400 mb-1"><span>{item.label}</span><span className="text-teal-400 font-medium">{item.score}/100</span></div>
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full" style={{ width: `${item.score}%` }} /></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Visualization Area */}
                <div className="flex-1 relative overflow-hidden" style={{ minHeight: '500px' }}>
                    <svg width="100%" height="100%" viewBox="0 0 600 500" className="absolute inset-0">
                        <defs><radialGradient id="bg-glow-map" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#14b8a6" stopOpacity="0.1" /><stop offset="100%" stopColor="#14b8a6" stopOpacity="0" /></radialGradient></defs>
                        <circle cx={centerX} cy={centerY} r="220" fill="url(#bg-glow-map)" />

                        {ring1Nodes.map((node, i) => <line key={`l1-${i}`} x1={centerX} y1={centerY} x2={node.x} y2={node.y} stroke="#334155" strokeWidth="1" opacity="0.5" />)}
                        {ring2Nodes.map((node, i) => { const closest = ring1Nodes[i % Math.max(ring1Nodes.length, 1)]; return closest ? <line key={`l2-${i}`} x1={closest.x} y1={closest.y} x2={node.x} y2={node.y} stroke="#334155" strokeWidth="1" opacity="0.3" /> : null; })}

                        <circle cx={centerX} cy={centerY} r="100" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
                        <circle cx={centerX} cy={centerY} r="180" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" opacity="0.2" />

                        {ring2Nodes.map((node, i) => <circle key={`r2-${i}`} cx={node.x} cy={node.y} r="8" fill={contentGaps[i] ? '#f43f5e' : '#f59e0b'} style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))' }} />)}
                        {ring1Nodes.map((node, i) => (
                            <g key={`r1-${i}`}>
                                <circle cx={node.x} cy={node.y} r="12" fill="#14b8a6" style={{ filter: 'drop-shadow(0 0 6px rgba(20, 184, 166, 0.6))' }} />
                                <text x={node.x + (node.angle > -Math.PI / 2 && node.angle < Math.PI / 2 ? 18 : -18)} y={node.y + 4} fill="#94a3b8" fontSize="10" textAnchor={node.angle > -Math.PI / 2 && node.angle < Math.PI / 2 ? 'start' : 'end'}>{node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label}</text>
                            </g>
                        ))}

                        <circle cx={centerX} cy={centerY} r="35" fill="#10b981" style={{ filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.7))' }} />
                        <circle cx={centerX} cy={centerY} r="25" fill="#34d399" />
                        <text x={centerX} y={centerY + 55} fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">{primaryTopic.length > 20 ? primaryTopic.substring(0, 20) + '...' : primaryTopic}</text>
                    </svg>
                </div>

                {/* Right Legend */}
                <div className="lg:w-40 p-4 border-t lg:border-t-0 lg:border-l border-slate-700">
                    <div className="text-slate-400 text-xs font-bold mb-3">DEPTH</div>
                    <div className="space-y-2">
                        {[
                            { color: 'bg-emerald-500', label: 'Primary', count: 1 },
                            { color: 'bg-teal-500', label: 'Secondary', count: ring1Nodes.length },
                            { color: 'bg-amber-500', label: 'Tertiary', count: ring2Nodes.filter((_, i) => !contentGaps[i]).length },
                            { color: 'bg-rose-500', label: 'Gaps', count: contentGaps.length },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${item.color}`}></div><span className="text-slate-400 text-xs">{item.label}</span></div>
                                <span className="text-slate-300 text-xs font-medium">{item.count}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-700">
                        <div className="text-slate-400 text-xs font-bold mb-2">TOTAL</div>
                        <div className="text-teal-400 text-2xl font-black">{1 + ring1Nodes.length + ring2Nodes.length}</div>
                        <div className="text-slate-500 text-xs">topics mapped</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// TOPIC COVERAGE MATRIX
// ============================================

function TopicCoverageMatrix({ yourTopics, competitorTopics }: {
    yourTopics?: TopicAnalysis;
    competitorTopics?: TopicAnalysis;
}) {
    return (
        <div className="bg-white rounded-2xl border border-teal-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">Topic Coverage Analysis</h3>
                    <p className="text-slate-500 text-sm">How comprehensively each site covers topics</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Your Topics */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
                    <h4 className="font-bold text-teal-800 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Your Topics
                    </h4>
                    <div className="mb-3">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Primary Topic</div>
                        <div className="font-bold text-slate-900">{yourTopics?.primaryTopic || 'Analyzing...'}</div>
                    </div>
                    <div className="mb-3">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Topic Depth</div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                                    style={{ width: `${yourTopics?.topicDepth || 0}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold text-teal-700">{yourTopics?.topicDepth || 0}%</span>
                        </div>
                    </div>
                    {yourTopics?.secondaryTopics && yourTopics.secondaryTopics.length > 0 && (
                        <div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Secondary Topics</div>
                            <div className="flex flex-wrap gap-1">
                                {yourTopics.secondaryTopics.slice(0, 5).map((topic, i) => (
                                    <span key={i} className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-md">
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Competitor Topics */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Competitor Topics
                    </h4>
                    <div className="mb-3">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Primary Topic</div>
                        <div className="font-bold text-slate-900">{competitorTopics?.primaryTopic || 'Analyzing...'}</div>
                    </div>
                    <div className="mb-3">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Topic Depth</div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-slate-500 rounded-full"
                                    style={{ width: `${competitorTopics?.topicDepth || 0}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold text-slate-600">{competitorTopics?.topicDepth || 0}%</span>
                        </div>
                    </div>
                    {competitorTopics?.secondaryTopics && competitorTopics.secondaryTopics.length > 0 && (
                        <div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Secondary Topics</div>
                            <div className="flex flex-wrap gap-1">
                                {competitorTopics.secondaryTopics.slice(0, 5).map((topic, i) => (
                                    <span key={i} className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded-md">
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================
// CONTENT GAP ANALYSIS PANEL
// ============================================

function ContentGapPanel({ yourTopics, competitorTopics }: {
    yourTopics?: TopicAnalysis;
    competitorTopics?: TopicAnalysis;
}) {
    const gaps = yourTopics?.contentGaps || [];
    const competitorAdvantages = yourTopics?.competitorAdvantages || [];
    const yourAdvantages = yourTopics?.yourAdvantages || [];

    const getSeverityColor = (severity: string) => {
        if (severity === 'high') return 'border-rose-300 bg-rose-50';
        if (severity === 'medium') return 'border-amber-300 bg-amber-50';
        return 'border-emerald-300 bg-emerald-50';
    };

    const getSeverityBadge = (severity: string) => {
        if (severity === 'high') return 'bg-rose-500';
        if (severity === 'medium') return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">Content Gap Analysis</h3>
                    <p className="text-slate-500 text-sm">Topics where you need to strengthen coverage</p>
                </div>
            </div>

            {/* Content Gaps */}
            {gaps.length > 0 ? (
                <div className="space-y-3 mb-6">
                    {gaps.slice(0, 4).map((gap, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${getSeverityColor(gap.severity)}`}>
                            <div className="flex items-start justify-between mb-2">
                                <span className="font-bold text-slate-900">{gap.topic}</span>
                                <span className={`px-2 py-0.5 rounded-full text-white text-xs font-medium ${getSeverityBadge(gap.severity)}`}>
                                    {gap.severity}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600">{gap.recommendation}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 mb-6">
                    <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">No significant content gaps detected!</span>
                    </div>
                </div>
            )}

            {/* Competitive Comparison */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Where Competitor Wins */}
                {competitorAdvantages.length > 0 && (
                    <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
                        <h4 className="font-bold text-rose-800 mb-3 flex items-center gap-2 text-sm">
                            <TrendingDown className="w-4 h-4" />
                            Where They Beat You
                        </h4>
                        <div className="space-y-2">
                            {competitorAdvantages.slice(0, 2).map((adv, i) => (
                                <div key={i} className="text-sm">
                                    <div className="font-medium text-slate-900">{adv.topic}</div>
                                    <div className="text-rose-600 text-xs">{adv.yourWeakness}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Where You Win */}
                {yourAdvantages.length > 0 && (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                        <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4" />
                            Where You Beat Them
                        </h4>
                        <div className="space-y-2">
                            {yourAdvantages.slice(0, 2).map((adv, i) => (
                                <div key={i} className="text-sm">
                                    <div className="font-medium text-slate-900">{adv.topic}</div>
                                    <div className="text-emerald-600 text-xs">{adv.yourStrength}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// ENHANCED CONTENT GAP PANEL (Claude AI-Powered)
// ============================================

function EnhancedContentGapPanel({ data, yourDomain, competitorDomain }: {
    data: ContentGapFromAI;
    yourDomain: string;
    competitorDomain: string;
}) {
    const getImportanceColor = (importance: string) => {
        switch (importance) {
            case 'critical': return 'bg-rose-500';
            case 'high': return 'bg-amber-500';
            case 'medium': return 'bg-sky-500';
            default: return 'bg-slate-400';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-rose-600';
        if (score >= 50) return 'text-amber-600';
        return 'text-emerald-600';
    };

    return (
        <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 rounded-2xl border border-violet-200 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg">AI Content Gap Analysis</h3>
                    <p className="text-slate-500 text-sm">Powered by Claude • Deep content comparison</p>
                </div>
                <div className="text-right">
                    <div className={`text-3xl font-black ${getScoreColor(data.gapScore)}`}>{data.gapScore}</div>
                    <div className="text-xs text-slate-500">Gap Score</div>
                </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-white rounded-xl p-4 mb-6 border border-violet-200 shadow-sm">
                <p className="text-slate-700 leading-relaxed">{data.executiveSummary}</p>
            </div>

            {/* Strategic Priorities */}
            {data.strategicPriorities.length > 0 && (
                <div className="mb-6">
                    <h4 className="font-bold text-violet-800 mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4" /> Strategic Priorities
                    </h4>
                    <div className="grid gap-2">
                        {data.strategicPriorities.slice(0, 3).map((priority, i) => (
                            <div key={i} className="flex items-start gap-3 bg-violet-100 rounded-lg p-3 border border-violet-200">
                                <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                    {i + 1}
                                </span>
                                <span className="text-sm text-slate-700">{priority}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Topics Missing */}
            {data.topicsMissing.length > 0 && (
                <div className="mb-6">
                    <h4 className="font-bold text-rose-700 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Missing Topics
                    </h4>
                    <div className="space-y-3">
                        {data.topicsMissing.slice(0, 4).map((gap, i) => (
                            <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                                <div className="flex items-start justify-between mb-2">
                                    <span className="font-bold text-slate-900">{gap.topic}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-white text-xs font-medium ${getImportanceColor(gap.importance)}`}>
                                        {gap.importance}
                                    </span>
                                </div>
                                <div className="grid md:grid-cols-2 gap-3 text-sm mb-2">
                                    <div className="bg-rose-50 rounded-lg p-2 border border-rose-100">
                                        <div className="text-xs text-rose-600 font-medium mb-1">Competitor Coverage</div>
                                        <div className="text-slate-700">{gap.competitorCoverage}</div>
                                    </div>
                                    <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                                        <div className="text-xs text-amber-600 font-medium mb-1">Your Gap</div>
                                        <div className="text-slate-700">{gap.yourGap}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-violet-700">
                                    <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    {gap.recommendation}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Depth Gaps */}
            {data.depthGaps.length > 0 && (
                <div className="mb-6">
                    <h4 className="font-bold text-amber-700 mb-3 flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Content Depth Gaps
                    </h4>
                    <div className="space-y-2">
                        {data.depthGaps.slice(0, 3).map((gap, i) => (
                            <div key={i} className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="font-medium text-slate-900 mb-1">{gap.area}</div>
                                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                    <span className="text-rose-600">Them: {gap.competitorDepth}</span>
                                    <span className="text-amber-600">You: {gap.yourDepth}</span>
                                </div>
                                <p className="text-xs text-slate-600">{gap.recommendation}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Wins & Format Gaps */}
            <div className="grid md:grid-cols-2 gap-4">
                {data.quickWins.length > 0 && (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                        <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2 text-sm">
                            <Zap className="w-4 h-4" /> Quick Wins
                        </h4>
                        <ul className="space-y-2">
                            {data.quickWins.slice(0, 4).map((win, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-emerald-700">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    {win}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {data.formatGaps.length > 0 && (
                    <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
                        <h4 className="font-bold text-sky-800 mb-3 flex items-center gap-2 text-sm">
                            <PieChart className="w-4 h-4" /> Format Gaps
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {data.formatGaps.slice(0, 6).map((format, i) => (
                                <span key={i} className="px-2 py-1 bg-sky-100 text-sky-700 text-xs rounded-md border border-sky-200">
                                    {format}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// E-E-A-T SIGNALS PANEL
// ============================================

function EEATSignalsPanel({ yourSignals, competitorSignals, yourDomain, competitorDomain }: {
    yourSignals: EEATSignals;
    competitorSignals: EEATSignals;
    yourDomain: string;
    competitorDomain: string;
}) {
    const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

    const pillars = [
        {
            key: 'experience',
            label: 'Experience',
            icon: Users,
            gradient: 'from-emerald-500 to-teal-500',
            bgGradient: 'from-emerald-50 to-teal-50',
            yourScore: yourSignals.experience.score,
            compScore: competitorSignals.experience.score,
            description: 'First-hand experience signals from real practitioners',
            metrics: [
                { label: 'Case Studies', you: yourSignals.experience.caseStudies, them: competitorSignals.experience.caseStudies },
                { label: 'Practical Examples', you: yourSignals.experience.practicalExamples, them: competitorSignals.experience.practicalExamples },
                { label: 'Client Testimonials', you: yourSignals.experience.clientTestimonials, them: competitorSignals.experience.clientTestimonials },
                { label: 'First-Person Narratives', you: yourSignals.experience.firstPersonNarratives, them: competitorSignals.experience.firstPersonNarratives },
            ],
            evidence: yourSignals.experience.evidence,
        },
        {
            key: 'expertise',
            label: 'Expertise',
            icon: Award,
            gradient: 'from-violet-500 to-purple-500',
            bgGradient: 'from-violet-50 to-purple-50',
            yourScore: yourSignals.expertise.score,
            compScore: competitorSignals.expertise.score,
            description: 'Demonstrated knowledge and credentials',
            metrics: [
                { label: 'Technical Depth', you: yourSignals.expertise.technicalDepth, them: competitorSignals.expertise.technicalDepth, isPercent: true },
                { label: 'Specialization Clarity', you: yourSignals.expertise.specializationClarity, them: competitorSignals.expertise.specializationClarity, isPercent: true },
                { label: 'Industry Terms', you: yourSignals.expertise.industryTerminology, them: competitorSignals.expertise.industryTerminology },
                { label: 'Authors Detected', you: yourSignals.expertise.authorsDetected?.length || 0, them: competitorSignals.expertise.authorsDetected?.length || 0 },
            ],
            evidence: yourSignals.expertise.evidence,
            credentials: yourSignals.expertise.credentialsFound,
        },
        {
            key: 'authoritativeness',
            label: 'Authoritativeness',
            icon: Star,
            gradient: 'from-amber-500 to-orange-500',
            bgGradient: 'from-amber-50 to-orange-50',
            yourScore: yourSignals.authoritativeness.score,
            compScore: competitorSignals.authoritativeness.score,
            description: 'Industry recognition and third-party validation',
            metrics: [
                { label: 'Wikipedia Presence', you: yourSignals.authoritativeness.wikipediaPresence ? 1 : 0, them: competitorSignals.authoritativeness.wikipediaPresence ? 1 : 0, isBool: true },
                { label: 'Press Mentions', you: yourSignals.authoritativeness.pressmentions, them: competitorSignals.authoritativeness.pressmentions },
                { label: 'Industry Awards', you: yourSignals.authoritativeness.industryAwards?.length || 0, them: competitorSignals.authoritativeness.industryAwards?.length || 0 },
                { label: 'Media Coverage', you: yourSignals.authoritativeness.mediaCoverage ? 1 : 0, them: competitorSignals.authoritativeness.mediaCoverage ? 1 : 0, isBool: true },
            ],
            evidence: yourSignals.authoritativeness.evidence,
            awards: yourSignals.authoritativeness.industryAwards,
        },
        {
            key: 'trustworthiness',
            label: 'Trustworthiness',
            icon: CheckCircle,
            gradient: 'from-sky-500 to-blue-500',
            bgGradient: 'from-sky-50 to-blue-50',
            yourScore: yourSignals.trustworthiness.score,
            compScore: competitorSignals.trustworthiness.score,
            description: 'Transparency, security, and credibility signals',
            metrics: [
                { label: 'Transparency Score', you: yourSignals.trustworthiness.transparencyScore, them: competitorSignals.trustworthiness.transparencyScore, isPercent: true },
                { label: 'HTTPS Secure', you: yourSignals.trustworthiness.secureConnection ? 1 : 0, them: competitorSignals.trustworthiness.secureConnection ? 1 : 0, isBool: true },
                { label: 'Privacy Policy', you: yourSignals.trustworthiness.privacyPolicy ? 1 : 0, them: competitorSignals.trustworthiness.privacyPolicy ? 1 : 0, isBool: true },
                { label: 'Contact Info', you: yourSignals.trustworthiness.contactInfoVisible ? 1 : 0, them: competitorSignals.trustworthiness.contactInfoVisible ? 1 : 0, isBool: true },
            ],
            evidence: yourSignals.trustworthiness.evidence,
        },
    ];

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-emerald-600';
        if (score >= 50) return 'text-amber-600';
        return 'text-rose-600';
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-200 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg">E-E-A-T Signal Analysis</h3>
                    <p className="text-slate-500 text-sm">Experience, Expertise, Authoritativeness, Trustworthiness</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className={`text-2xl font-black ${getScoreColor(yourSignals.overallScore)}`}>{yourSignals.overallScore}</div>
                        <div className="text-xs text-slate-500">You</div>
                    </div>
                    <div className="text-slate-300 font-bold">vs</div>
                    <div className="text-center">
                        <div className={`text-2xl font-black ${getScoreColor(competitorSignals.overallScore)}`}>{competitorSignals.overallScore}</div>
                        <div className="text-xs text-slate-500">Them</div>
                    </div>
                </div>
            </div>

            {/* 4 Pillars Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {pillars.map((pillar) => {
                    const Icon = pillar.icon;
                    const isExpanded = expandedPillar === pillar.key;
                    const diff = pillar.yourScore - pillar.compScore;

                    return (
                        <div
                            key={pillar.key}
                            className={`rounded-xl border transition-all cursor-pointer ${isExpanded
                                ? `border-2 border-indigo-300 bg-gradient-to-br ${pillar.bgGradient}`
                                : 'border-slate-200 bg-white hover:border-indigo-200'
                                }`}
                            onClick={() => setExpandedPillar(isExpanded ? null : pillar.key)}
                        >
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${pillar.gradient} flex items-center justify-center`}>
                                            <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">{pillar.label}</div>
                                            <div className="text-xs text-slate-500">{pillar.description}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold ${getScoreColor(pillar.yourScore)}`}>{pillar.yourScore}</span>
                                        <span className="text-slate-400 text-sm">vs</span>
                                        <span className="text-slate-600">{pillar.compScore}</span>
                                        {Math.abs(diff) >= 5 && (
                                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${diff > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                {diff > 0 ? '+' : ''}{diff}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Score Bar */}
                                <div className="flex gap-1 h-2 mb-2">
                                    <div className="flex-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${pillar.gradient} rounded-full transition-all`}
                                            style={{ width: `${pillar.yourScore}%` }}
                                        />
                                    </div>
                                    <div className="flex-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-slate-400 rounded-full transition-all"
                                            style={{ width: `${pillar.compScore}%` }}
                                        />
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                                        {/* Metrics */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {pillar.metrics.map((metric, i) => (
                                                <div key={i} className="bg-white/50 rounded-lg p-2 text-xs">
                                                    <div className="text-slate-500 mb-1">{metric.label}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold ${(metric as any).isBool
                                                            ? (metric.you ? 'text-emerald-600' : 'text-rose-600')
                                                            : 'text-indigo-600'
                                                            }`}>
                                                            {(metric as any).isBool ? (metric.you ? '✓' : '✗') : metric.you}
                                                            {(metric as any).isPercent && '%'}
                                                        </span>
                                                        <span className="text-slate-400">vs</span>
                                                        <span className="text-slate-600">
                                                            {(metric as any).isBool ? (metric.them ? '✓' : '✗') : metric.them}
                                                            {(metric as any).isPercent && '%'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Evidence */}
                                        {pillar.evidence && pillar.evidence.length > 0 && (
                                            <div>
                                                <div className="text-xs font-medium text-slate-600 mb-1">Evidence Found:</div>
                                                <ul className="space-y-1">
                                                    {pillar.evidence.slice(0, 2).map((e, i) => (
                                                        <li key={i} className="text-xs text-slate-500 flex items-start gap-1">
                                                            <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                            {e}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recommendations */}
            {yourSignals.comparison?.recommendations && yourSignals.comparison.recommendations.length > 0 && (
                <div className="mt-6 bg-white rounded-xl p-4 border border-indigo-200">
                    <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2 text-sm">
                        <Lightbulb className="w-4 h-4" /> E-E-A-T Recommendations
                    </h4>
                    <ul className="space-y-2">
                        {yourSignals.comparison.recommendations.slice(0, 3).map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                    {i + 1}
                                </span>
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ============================================
// SUBCATEGORY BREAKDOWN PANEL
// ============================================

function SubcategoryBreakdownPanel({ yourSubcats, compSubcats }: {
    yourSubcats: Record<string, SubcategoryData>;
    compSubcats: Record<string, SubcategoryData>;
}) {
    const [expandedKey, setExpandedKey] = useState<string | null>(null);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">Authority Breakdown</h3>
                    <p className="text-slate-500 text-sm">Detailed scoring across authority dimensions</p>
                </div>
            </div>

            <div className="space-y-3">
                {Object.entries(SUBCATEGORY_CONFIG).map(([key, config]) => {
                    const yourSub = yourSubcats[key];
                    const compSub = compSubcats[key];
                    const yourScore = yourSub?.score ?? 0;
                    const compScore = compSub?.score ?? 0;
                    const diff = yourScore - compScore;
                    const isExpanded = expandedKey === key;
                    const Icon = config.icon;

                    return (
                        <div
                            key={key}
                            className={`rounded-xl border transition-all ${isExpanded ? 'border-teal-300 bg-teal-50' : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <button
                                onClick={() => setExpandedKey(isExpanded ? null : key)}
                                className="w-full p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                                        <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-slate-900 text-sm">{config.label}</div>
                                        <div className="text-xs text-slate-500">{config.description}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-teal-600">{yourScore}</span>
                                            <span className="text-slate-400">vs</span>
                                            <span className="text-slate-600">{compScore}</span>
                                        </div>
                                    </div>
                                    <ComparisonBadge diff={diff} />
                                    {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="px-4 pb-4 border-t border-teal-200 pt-4">
                                    <div className="bg-white rounded-lg p-3 mb-3">
                                        <p className="text-sm text-slate-600 italic">{config.whyItMatters}</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        {/* Your Evidence */}
                                        <div>
                                            <div className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">Your Evidence</div>
                                            {yourSub?.evidence?.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {yourSub.evidence.slice(0, 3).map((e, i) => (
                                                        <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                                                            <CheckCircle className="w-3 h-3 text-teal-500 flex-shrink-0 mt-0.5" />
                                                            {e}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">No evidence available</p>
                                            )}
                                        </div>

                                        {/* Your Issues */}
                                        <div>
                                            <div className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-2">Issues to Fix</div>
                                            {yourSub?.issues?.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {yourSub.issues.slice(0, 3).map((issue, i) => (
                                                        <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                                                            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                                                            {issue}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-xs text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> No issues detected
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================
// QUICK WINS PANEL
// ============================================

function QuickWinsPanel({ recommendations, insights }: {
    recommendations: string[];
    insights: string[];
}) {
    return (
        <div className="bg-gradient-to-br from-teal-600 via-cyan-600 to-emerald-600 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Quick Wins to Build Authority</h3>
                    <p className="text-white/70 text-sm">Highest-impact actions for topical dominance</p>
                </div>
            </div>

            <div className="space-y-3">
                {recommendations.slice(0, 5).map((rec, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                {i + 1}
                            </div>
                            <p className="text-sm text-white/90">{rec}</p>
                        </div>
                    </div>
                ))}
            </div>

            {insights.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/20">
                    <h4 className="text-sm font-bold text-white/90 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Key Insights
                    </h4>
                    <div className="grid gap-2">
                        {insights.slice(0, 3).map((insight, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-white/80">
                                <CheckCircle className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                                {insight}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function TopicalAuthorityDetail({
    yourData,
    competitorData,
    yourDomain,
    competitorDomain,
    contentGapFromAI,
    eeatSignals
}: Props) {
    const yourScore = yourData?.score ?? 0;
    const compScore = competitorData?.score ?? 0;
    const diff = yourScore - compScore;

    const formatDomain = (url: string) => {
        try {
            return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
        } catch { return url; }
    };

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 rounded-3xl p-8 border border-teal-200 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">TOPICAL AUTHORITY LAB</h2>
                </div>
                <p className="text-slate-600 mb-6 max-w-2xl">
                    Deep analysis of entity coverage, topic depth, and authority signals.
                    Understand exactly where you need to build content to dominate your niche.
                </p>

                {/* Score Comparison */}
                <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
                    <div className="text-center">
                        <AnimatedAuthorityRing score={yourScore} isYou={true} />
                        <div className="mt-3">
                            <div className="font-bold text-slate-900">{formatDomain(yourDomain)}</div>
                            {yourData.authorityLevel && (
                                <div className="mt-2">
                                    <AuthorityLevelBadge level={yourData.authorityLevel} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <ComparisonBadge diff={diff} />
                        <div className="text-xs text-slate-500 font-medium">AUTHORITY GAP</div>
                    </div>

                    <div className="text-center">
                        <AnimatedAuthorityRing score={compScore} isYou={false} />
                        <div className="mt-3">
                            <div className="font-bold text-slate-900">{formatDomain(competitorDomain)}</div>
                            {competitorData.authorityLevel && (
                                <div className="mt-2">
                                    <AuthorityLevelBadge level={competitorData.authorityLevel} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Entity Intelligence */}
            <EntityIntelligencePanel
                yourEntities={yourData.entityAnalysis}
                competitorEntities={competitorData.entityAnalysis}
            />

            {/* Topic Cluster Map - Visual Authority Structure */}
            <TopicClusterMap
                yourTopics={yourData.topicAnalysis}
                competitorTopics={competitorData.topicAnalysis}
                yourScore={yourScore}
                competitorScore={compScore}
            />

            {/* Topic Coverage */}
            <TopicCoverageMatrix
                yourTopics={yourData.topicAnalysis}
                competitorTopics={competitorData.topicAnalysis}
            />

            {/* E-E-A-T Signal Analysis (when available) */}
            {eeatSignals && (
                <EEATSignalsPanel
                    yourSignals={eeatSignals.you}
                    competitorSignals={eeatSignals.competitor}
                    yourDomain={yourDomain}
                    competitorDomain={competitorDomain}
                />
            )}

            {/* AI-Powered Content Gap Analysis (when available) */}
            {contentGapFromAI && (
                <EnhancedContentGapPanel
                    data={contentGapFromAI}
                    yourDomain={yourDomain}
                    competitorDomain={competitorDomain}
                />
            )}

            {/* Basic Content Gaps (fallback) */}
            <ContentGapPanel
                yourTopics={yourData.topicAnalysis}
                competitorTopics={competitorData.topicAnalysis}
            />

            {/* Subcategory Breakdown */}
            <SubcategoryBreakdownPanel
                yourSubcats={yourData.subcategories || {}}
                compSubcats={competitorData.subcategories || {}}
            />

            {/* Quick Wins */}
            <QuickWinsPanel
                recommendations={yourData.recommendations || []}
                insights={yourData.insights || []}
            />
        </div>
    );
}
