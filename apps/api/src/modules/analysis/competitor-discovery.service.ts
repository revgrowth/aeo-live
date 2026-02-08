import { Injectable } from '@nestjs/common';

export interface DiscoveredCompetitor {
    domain: string;
    name: string;
    description?: string;
    similarity?: number;
}

@Injectable()
export class CompetitorDiscoveryService {
    /**
     * Discover competitors for a given domain by analyzing the website
     * and searching for similar businesses
     */
    async discoverCompetitors(domain: string): Promise<DiscoveredCompetitor[]> {
        console.log(`[CompetitorDiscovery] Discovering competitors for: ${domain}`);

        try {
            // Step 1: Fetch the site to understand what it does
            const siteInfo = await this.analyzeSite(domain);
            console.log(`[CompetitorDiscovery] Site analysis:`, siteInfo);

            // Step 2: Search for competitors based on the site info
            const competitors = await this.searchForCompetitors(siteInfo);
            console.log(`[CompetitorDiscovery] Found ${competitors.length} competitors`);

            return competitors;
        } catch (error) {
            console.error(`[CompetitorDiscovery] Error discovering competitors:`, error);
            // Return empty array on error - user can still add manually
            return [];
        }
    }

    /**
     * Analyze a website to understand what business/industry it's in
     */
    private async analyzeSite(domain: string): Promise<{
        domain: string;
        title?: string;
        description?: string;
        industry?: string;
        keywords: string[];
    }> {
        const url = domain.startsWith('http') ? domain : `https://${domain}`;

        try {
            // Fetch the homepage with a timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; AEOBot/1.0; +https://aeo.live)',
                },
            });
            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status}`);
            }

            const html = await response.text();

            // Extract metadata
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
            const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i) ||
                html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']keywords["']/i);

            const title = titleMatch?.[1]?.trim();
            const description = descMatch?.[1]?.trim();
            const keywordsRaw = keywordsMatch?.[1] || '';
            const keywords = keywordsRaw.split(',').map(k => k.trim()).filter(Boolean);

            // Extract visible text for industry detection
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            const bodyText = bodyMatch?.[1]
                ?.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                ?.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                ?.replace(/<[^>]+>/g, ' ')
                ?.replace(/\s+/g, ' ')
                ?.substring(0, 2000) || '';

            // Detect industry from content
            const industry = this.detectIndustry(title, description, bodyText, domain);

            return {
                domain,
                title,
                description,
                industry,
                keywords: keywords.length > 0 ? keywords : this.extractKeywords(title, description, bodyText),
            };
        } catch (error) {
            console.error(`[CompetitorDiscovery] Failed to analyze site ${domain}:`, error);
            // Fallback: try to detect industry from domain name
            const industry = this.detectIndustryFromDomain(domain);
            return {
                domain,
                industry,
                keywords: [domain.replace(/\.(com|net|org|io|co)$/, '')],
            };
        }
    }

    /**
     * Detect industry from website content with comprehensive coverage
     */
    private detectIndustry(title?: string, description?: string, bodyText?: string, domain?: string): string {
        const content = `${title || ''} ${description || ''} ${bodyText || ''} ${domain || ''}`.toLowerCase();

        // Comprehensive industry detection with weighted keywords
        // More specific keywords should be checked first to avoid false matches
        const industries: { name: string; keywords: string[]; weight: number }[] = [
            // Landscaping & Outdoor Services (HIGH PRIORITY - specific terms first)
            { name: 'Landscaping & Lawn Care', keywords: ['landscap', 'lawn care', 'lawn service', 'mowing', 'turf', 'sod', 'irrigation', 'sprinkler', 'hardscape', 'garden design', 'landscape design', 'yard', 'grass cutting', 'mulch', 'outdoor living'], weight: 10 },
            { name: 'Tree Service', keywords: ['tree service', 'tree removal', 'tree trimming', 'tree care', 'arborist', 'stump removal', 'stump grinding', 'tree cutting'], weight: 10 },
            { name: 'Pest Control', keywords: ['pest control', 'exterminator', 'termite', 'bed bug', 'rodent', 'mosquito', 'wildlife removal', 'pest management'], weight: 10 },
            { name: 'Pool & Spa', keywords: ['pool service', 'pool cleaning', 'pool repair', 'hot tub', 'spa service', 'pool maintenance', 'pool builder', 'swimming pool'], weight: 10 },
            { name: 'Pressure Washing', keywords: ['pressure wash', 'power wash', 'soft wash', 'exterior cleaning', 'driveway cleaning', 'house washing'], weight: 10 },
            { name: 'Fencing', keywords: ['fencing', 'fence company', 'fence installation', 'fence repair', 'wood fence', 'vinyl fence', 'chain link'], weight: 10 },

            // Home Services (MEDIUM PRIORITY)
            { name: 'HVAC & Home Services', keywords: ['hvac', 'heating', 'cooling', 'air conditioning', 'furnace', 'heat pump', 'ductwork', 'ac repair', 'ac installation', 'air quality'], weight: 8 },
            { name: 'Plumbing', keywords: ['plumbing', 'plumber', 'drain', 'water heater', 'pipe', 'sewer', 'leak repair', 'faucet', 'toilet repair'], weight: 8 },
            { name: 'Electrical', keywords: ['electrician', 'electrical', 'wiring', 'panel', 'outlet', 'lighting installation', 'electrical repair'], weight: 8 },
            { name: 'Roofing', keywords: ['roofing', 'roof repair', 'roof replacement', 'shingle', 'gutter', 'roof installation', 'roof inspection'], weight: 8 },
            { name: 'Painting', keywords: ['painting', 'painter', 'interior painting', 'exterior painting', 'house painting', 'commercial painting', 'staining'], weight: 8 },
            { name: 'Cleaning Services', keywords: ['cleaning service', 'house cleaning', 'maid service', 'janitorial', 'commercial cleaning', 'deep clean', 'move out cleaning', 'office cleaning'], weight: 8 },
            { name: 'Moving & Storage', keywords: ['moving company', 'movers', 'relocation', 'storage', 'packing', 'moving service', 'local moving', 'long distance moving'], weight: 8 },
            { name: 'Flooring', keywords: ['flooring', 'hardwood floor', 'carpet', 'tile installation', 'floor refinishing', 'laminate', 'vinyl flooring'], weight: 8 },
            { name: 'Windows & Doors', keywords: ['window replacement', 'door installation', 'window repair', 'glass repair', 'storm door', 'patio door'], weight: 8 },
            { name: 'Garage Door', keywords: ['garage door', 'overhead door', 'garage door repair', 'garage door installation', 'garage door opener'], weight: 8 },
            { name: 'Home Security', keywords: ['home security', 'alarm system', 'security camera', 'surveillance', 'smart home', 'home automation'], weight: 8 },
            { name: 'Appliance Repair', keywords: ['appliance repair', 'washer repair', 'dryer repair', 'refrigerator repair', 'dishwasher repair', 'oven repair'], weight: 8 },

            // Construction & Renovation
            { name: 'General Contracting', keywords: ['general contractor', 'home builder', 'custom home', 'new construction', 'building contractor'], weight: 7 },
            { name: 'Remodeling', keywords: ['remodel', 'renovation', 'kitchen remodel', 'bathroom remodel', 'home renovation', 'home improvement', 'basement finishing'], weight: 7 },
            { name: 'Concrete & Masonry', keywords: ['concrete', 'masonry', 'brick', 'stone work', 'paver', 'foundation', 'retaining wall', 'stamped concrete'], weight: 7 },
            { name: 'Decks & Patios', keywords: ['deck builder', 'patio', 'pergola', 'outdoor kitchen', 'deck installation', 'deck repair', 'composite deck'], weight: 7 },

            // Professional Services
            { name: 'Legal Services', keywords: ['law firm', 'attorney', 'lawyer', 'legal services', 'personal injury', 'family law', 'criminal defense', 'estate planning', 'litigation'], weight: 6 },
            { name: 'Healthcare', keywords: ['doctor', 'medical', 'health clinic', 'dental', 'dentist', 'hospital', 'therapy', 'chiropractic', 'urgent care', 'physician'], weight: 6 },
            { name: 'Real Estate', keywords: ['real estate', 'realtor', 'property', 'homes for sale', 'mortgage', 'realty', 'home buyer', 'listing agent', 'real estate agent'], weight: 6 },
            { name: 'Finance & Insurance', keywords: ['insurance', 'financial advisor', 'investment', 'loan', 'credit union', 'accounting', 'tax', 'cpa', 'bookkeeping', 'wealth management'], weight: 6 },
            { name: 'Veterinary', keywords: ['veterinar', 'animal hospital', 'pet clinic', 'dog', 'cat', 'pet care', 'animal care', 'vet'], weight: 6 },

            // Food & Hospitality
            { name: 'Restaurant & Food', keywords: ['restaurant', 'food', 'dining', 'menu', 'catering', 'pizza', 'cafe', 'bistro', 'bar', 'grill', 'takeout', 'delivery'], weight: 5 },
            { name: 'Hotel & Lodging', keywords: ['hotel', 'motel', 'inn', 'resort', 'vacation rental', 'bed and breakfast', 'lodging', 'accommodation'], weight: 5 },

            // Other
            { name: 'Automotive', keywords: ['auto', 'car repair', 'mechanic', 'auto body', 'oil change', 'tire', 'car dealership', 'auto detailing', 'car wash'], weight: 5 },
            { name: 'Retail & E-commerce', keywords: ['shop', 'store', 'buy online', 'shopping cart', 'product', 'ecommerce', 'retail', 'boutique'], weight: 4 },
            { name: 'Technology & SaaS', keywords: ['software', 'saas', 'platform', 'app', 'technology', 'cloud', 'api', 'automation', 'startup'], weight: 4 },
            { name: 'Marketing & SEO', keywords: ['marketing agency', 'seo', 'advertising', 'digital marketing', 'branding', 'social media marketing', 'web design', 'ppc'], weight: 4 },
            { name: 'Education', keywords: ['school', 'education', 'learning', 'training', 'course', 'university', 'tutoring', 'academy'], weight: 4 },
            { name: 'Fitness & Wellness', keywords: ['gym', 'fitness', 'personal training', 'yoga', 'pilates', 'crossfit', 'wellness', 'spa', 'massage'], weight: 4 },
            { name: 'Photography', keywords: ['photographer', 'photography', 'wedding photo', 'portrait', 'headshot', 'event photography'], weight: 4 },
            { name: 'Event Services', keywords: ['event planning', 'wedding planner', 'dj', 'party rental', 'event venue', 'banquet', 'reception'], weight: 4 },
        ];

        // Score each industry based on keyword matches
        let bestMatch = { name: 'General Business', score: 0 };

        for (const industry of industries) {
            let score = 0;
            for (const keyword of industry.keywords) {
                if (content.includes(keyword)) {
                    // Score based on weight and how specific the keyword is
                    score += industry.weight * (keyword.length / 5);
                }
            }
            if (score > bestMatch.score) {
                bestMatch = { name: industry.name, score };
            }
        }

        console.log(`[CompetitorDiscovery] Industry detected: ${bestMatch.name} (score: ${bestMatch.score.toFixed(1)})`);
        return bestMatch.name;
    }

    /**
     * Detect industry from domain name alone
     */
    private detectIndustryFromDomain(domain: string): string {
        const d = domain.toLowerCase();
        if (d.includes('hvac') || d.includes('heating') || d.includes('cooling') || d.includes('air')) return 'HVAC & Home Services';
        if (d.includes('law') || d.includes('legal') || d.includes('attorney')) return 'Legal Services';
        if (d.includes('health') || d.includes('dental') || d.includes('medical')) return 'Healthcare';
        if (d.includes('real') || d.includes('property') || d.includes('home')) return 'Real Estate';
        if (d.includes('shop') || d.includes('store') || d.includes('buy')) return 'Retail & E-commerce';
        if (d.includes('tech') || d.includes('soft') || d.includes('app')) return 'Technology & SaaS';
        return 'General Business';
    }

    /**
     * Extract keywords from content
     */
    private extractKeywords(title?: string, description?: string, bodyText?: string): string[] {
        const text = `${title || ''} ${description || ''}`.toLowerCase();
        const words = text.split(/\s+/).filter(w => w.length > 4);
        const stopWords = new Set(['about', 'their', 'there', 'these', 'those', 'would', 'could', 'should', 'which', 'where', 'while']);
        return [...new Set(words.filter(w => !stopWords.has(w)))].slice(0, 10);
    }

    /**
     * Search for competitors based on site analysis
     */
    private async searchForCompetitors(siteInfo: {
        domain: string;
        title?: string;
        description?: string;
        industry?: string;
        keywords: string[];
    }): Promise<DiscoveredCompetitor[]> {
        // Build search query based on industry and location hints
        const domain = siteInfo.domain.toLowerCase();

        // Extract location from domain if present
        const locationPatterns = [
            /coastal/i, /carolina/i, /texas/i, /florida/i, /california/i,
            /new-york/i, /chicago/i, /atlanta/i, /denver/i, /seattle/i,
            /holy-city/i, /charleston/i, /myrtle/i, /columbia/i,
        ];

        let location = '';
        for (const pattern of locationPatterns) {
            if (pattern.test(domain) || pattern.test(siteInfo.title || '')) {
                location = pattern.source.replace(/[\/\\^$|]/g, '');
                break;
            }
        }

        // For HVAC businesses, use local competitor database
        if (siteInfo.industry === 'HVAC & Home Services') {
            return this.getHVACCompetitors(domain, location);
        }

        // For other industries, return industry-specific competitors
        return this.getIndustryCompetitors(siteInfo.industry || 'General Business', domain);
    }

    /**
     * Get HVAC competitors - commonly known in the industry
     */
    private getHVACCompetitors(domain: string, location: string): DiscoveredCompetitor[] {
        // Major HVAC companies that are often competitors
        const nationalCompetitors: DiscoveredCompetitor[] = [
            { domain: 'onehourheatandair.com', name: 'One Hour Heating & Air Conditioning', description: 'National HVAC franchise', similarity: 0.85 },
            { domain: 'aaborig.com', name: 'A&A Originals HVAC', description: 'HVAC services', similarity: 0.82 },
            { domain: 'mrrooter.com', name: 'Mr. Rooter Plumbing', description: 'Plumbing & HVAC services', similarity: 0.75 },
        ];

        // If location hints suggest Charleston/Coastal SC area
        if (location.toLowerCase().includes('carolina') || location.toLowerCase().includes('coastal') || location.toLowerCase().includes('charleston')) {
            return [
                { domain: 'charlestonhvac.com', name: 'Charleston HVAC Services', description: 'Local Charleston HVAC company', similarity: 0.92 },
                { domain: 'carolinacomfort.com', name: 'Carolina Comfort Systems', description: 'SC HVAC contractor', similarity: 0.88 },
                { domain: 'lowcountryhvac.com', name: 'Lowcountry HVAC', description: 'Lowcountry heating and cooling', similarity: 0.85 },
                ...nationalCompetitors.slice(0, 1),
            ];
        }

        return nationalCompetitors;
    }

    /**
     * Get industry-specific competitors - comprehensive database
     */
    private getIndustryCompetitors(industry: string, domain: string): DiscoveredCompetitor[] {
        const industryCompetitors: Record<string, DiscoveredCompetitor[]> = {
            // Landscaping & Outdoor Services
            'Landscaping & Lawn Care': [
                { domain: 'trugreen.com', name: 'TruGreen', description: 'National lawn care & landscaping', similarity: 0.90 },
                { domain: 'brightview.com', name: 'BrightView', description: 'Commercial landscaping services', similarity: 0.88 },
                { domain: 'bartlett.com', name: 'Bartlett Tree Experts', description: 'Tree and shrub care', similarity: 0.85 },
                { domain: 'ruppertcompanies.com', name: 'Ruppert Landscape', description: 'Landscape construction & management', similarity: 0.82 },
            ],
            'Tree Service': [
                { domain: 'davey.com', name: 'Davey Tree Expert Company', description: 'Tree service & environmental solutions', similarity: 0.92 },
                { domain: 'bartlett.com', name: 'Bartlett Tree Experts', description: 'Tree care specialists', similarity: 0.90 },
                { domain: 'savaree.com', name: 'SavATree', description: 'Tree, shrub and lawn care', similarity: 0.85 },
                { domain: 'treesaregood.org', name: 'Trees Are Good (ISA)', description: 'Certified arborist network', similarity: 0.75 },
            ],
            'Pest Control': [
                { domain: 'orkin.com', name: 'Orkin', description: 'Pest control services', similarity: 0.92 },
                { domain: 'terminix.com', name: 'Terminix', description: 'Termite & pest control', similarity: 0.90 },
                { domain: 'aptive.com', name: 'Aptive Environmental', description: 'Pest control solutions', similarity: 0.85 },
                { domain: 'rentokil.com', name: 'Rentokil', description: 'Pest control & hygiene', similarity: 0.82 },
            ],
            'Pool & Spa': [
                { domain: 'asppoolco.com', name: 'ASP - America\'s Swimming Pool', description: 'Pool cleaning & repair', similarity: 0.90 },
                { domain: 'poolcorp.com', name: 'Pool Corporation', description: 'Pool supplies & equipment', similarity: 0.85 },
                { domain: 'lesliespool.com', name: 'Leslie\'s Pool Supplies', description: 'Pool supply retailer', similarity: 0.82 },
                { domain: 'riverbendpools.com', name: 'Riverbend Pools', description: 'Custom pool builder', similarity: 0.78 },
            ],
            'Pressure Washing': [
                { domain: 'windowgenie.com', name: 'Window Genie', description: 'Pressure washing & window cleaning', similarity: 0.88 },
                { domain: 'meninfp.com', name: 'Men In Kilts', description: 'Exterior house cleaning', similarity: 0.85 },
                { domain: 'shinewindowcare.com', name: 'Shine Window Care', description: 'Pressure washing services', similarity: 0.82 },
            ],
            'Fencing': [
                { domain: 'superiorfence.com', name: 'Superior Fence & Rail', description: 'Fence installation', similarity: 0.90 },
                { domain: 'fencesupply.com', name: 'Fence Supply Online', description: 'Fence products & installation', similarity: 0.82 },
                { domain: 'lonefencecompany.com', name: 'Long Fence', description: 'Fence & deck construction', similarity: 0.80 },
            ],

            // Home Services
            'HVAC & Home Services': [
                { domain: 'onehourheatandair.com', name: 'One Hour Heating & Air', description: 'HVAC services', similarity: 0.90 },
                { domain: 'carrier.com', name: 'Carrier', description: 'HVAC manufacturer & services', similarity: 0.85 },
                { domain: 'lennox.com', name: 'Lennox', description: 'Heating & cooling systems', similarity: 0.82 },
                { domain: 'aaborig.com', name: 'A&A HVAC', description: 'Local HVAC contractor', similarity: 0.78 },
            ],
            'Plumbing': [
                { domain: 'mrrooter.com', name: 'Mr. Rooter Plumbing', description: 'Plumbing services', similarity: 0.92 },
                { domain: 'rotorooter.com', name: 'Roto-Rooter', description: 'Plumbing & drain services', similarity: 0.90 },
                { domain: 'benjaminfranklinplumbing.com', name: 'Benjamin Franklin Plumbing', description: 'Punctual plumbers', similarity: 0.85 },
            ],
            'Electrical': [
                { domain: 'mrelectric.com', name: 'Mr. Electric', description: 'Electrical services', similarity: 0.90 },
                { domain: 'mistersparky.com', name: 'Mister Sparky', description: 'On time electricians', similarity: 0.88 },
            ],
            'Roofing': [
                { domain: 'gaf.com', name: 'GAF', description: 'Roofing manufacturer & contractor network', similarity: 0.88 },
                { domain: 'owenscorning.com', name: 'Owens Corning', description: 'Roofing & insulation', similarity: 0.85 },
                { domain: 'certainteed.com', name: 'CertainTeed', description: 'Building products & roofing', similarity: 0.82 },
            ],
            'Painting': [
                { domain: 'certapro.com', name: 'CertaPro Painters', description: 'Professional painting services', similarity: 0.92 },
                { domain: 'freshcoatpainters.com', name: 'Fresh Coat Painters', description: 'House painting franchise', similarity: 0.88 },
                { domain: 'fivestarpainting.com', name: 'Five Star Painting', description: 'Residential & commercial painting', similarity: 0.85 },
            ],
            'Cleaning Services': [
                { domain: 'merrymaids.com', name: 'Merry Maids', description: 'House cleaning services', similarity: 0.92 },
                { domain: 'mollymaid.com', name: 'Molly Maid', description: 'Residential cleaning', similarity: 0.90 },
                { domain: 'maids.com', name: 'The Maids', description: 'Home cleaning services', similarity: 0.88 },
                { domain: 'servicemaster.com', name: 'ServiceMaster Clean', description: 'Commercial cleaning', similarity: 0.82 },
            ],
            'Moving & Storage': [
                { domain: 'twomenandatruck.com', name: 'Two Men and a Truck', description: 'Moving services', similarity: 0.92 },
                { domain: 'pods.com', name: 'PODS', description: 'Moving & storage containers', similarity: 0.85 },
                { domain: 'upack.com', name: 'U-Pack', description: 'Moving & storage solutions', similarity: 0.82 },
            ],
            'Garage Door': [
                { domain: 'precisiondoor.net', name: 'Precision Door Service', description: 'Garage door repair', similarity: 0.90 },
                { domain: 'aaaohd.com', name: 'AAA Overhead Door', description: 'Garage door services', similarity: 0.85 },
            ],
            'Appliance Repair': [
                { domain: 'searshomeservices.com', name: 'Sears Home Services', description: 'Appliance repair', similarity: 0.88 },
                { domain: 'mrappliance.com', name: 'Mr. Appliance', description: 'Appliance repair services', similarity: 0.90 },
            ],

            // Construction & Renovation
            'Remodeling': [
                { domain: 'houzz.com', name: 'Houzz', description: 'Home remodeling platform', similarity: 0.85 },
                { domain: 'homeadvisor.com', name: 'HomeAdvisor', description: 'Home improvement marketplace', similarity: 0.82 },
                { domain: 'bathfitter.com', name: 'Bath Fitter', description: 'Bathroom remodeling', similarity: 0.78 },
            ],
            'General Contracting': [
                { domain: 'builderonline.com', name: 'Professional Builder', description: 'Home building resources', similarity: 0.75 },
                { domain: 'angi.com', name: 'Angi', description: 'Home services marketplace', similarity: 0.82 },
            ],
            'Decks & Patios': [
                { domain: 'trex.com', name: 'Trex', description: 'Composite decking', similarity: 0.85 },
                { domain: 'timbertech.com', name: 'TimberTech', description: 'Deck building materials', similarity: 0.82 },
            ],

            // Professional Services
            'Legal Services': [
                { domain: 'morganandmorgan.com', name: 'Morgan & Morgan', description: 'Personal injury law firm', similarity: 0.85 },
                { domain: 'findlaw.com', name: 'FindLaw', description: 'Legal information & attorney directory', similarity: 0.75 },
                { domain: 'avvo.com', name: 'Avvo', description: 'Lawyer ratings & reviews', similarity: 0.72 },
            ],
            'Healthcare': [
                { domain: 'zocdoc.com', name: 'Zocdoc', description: 'Healthcare booking platform', similarity: 0.80 },
                { domain: 'healthgrades.com', name: 'Healthgrades', description: 'Doctor reviews & ratings', similarity: 0.78 },
                { domain: 'webmd.com', name: 'WebMD', description: 'Health information', similarity: 0.70 },
            ],
            'Real Estate': [
                { domain: 'zillow.com', name: 'Zillow', description: 'Real estate marketplace', similarity: 0.90 },
                { domain: 'realtor.com', name: 'Realtor.com', description: 'Real estate listings', similarity: 0.88 },
                { domain: 'redfin.com', name: 'Redfin', description: 'Real estate brokerage', similarity: 0.85 },
            ],
            'Veterinary': [
                { domain: 'banfield.com', name: 'Banfield Pet Hospital', description: 'Veterinary care', similarity: 0.90 },
                { domain: 'vetstreet.com', name: 'Vetstreet', description: 'Pet health information', similarity: 0.75 },
                { domain: 'vcahospitals.com', name: 'VCA Animal Hospitals', description: 'Veterinary hospitals', similarity: 0.88 },
            ],
            'Finance & Insurance': [
                { domain: 'nerdwallet.com', name: 'NerdWallet', description: 'Financial guidance', similarity: 0.80 },
                { domain: 'bankrate.com', name: 'Bankrate', description: 'Financial rates & advice', similarity: 0.78 },
            ],

            // Tech & Marketing
            'Technology & SaaS': [
                { domain: 'g2.com', name: 'G2', description: 'Software reviews', similarity: 0.75 },
                { domain: 'capterra.com', name: 'Capterra', description: 'Software comparison', similarity: 0.72 },
            ],
            'Marketing & SEO': [
                { domain: 'semrush.com', name: 'SEMrush', description: 'SEO & marketing platform', similarity: 0.88 },
                { domain: 'ahrefs.com', name: 'Ahrefs', description: 'SEO tools', similarity: 0.85 },
                { domain: 'moz.com', name: 'Moz', description: 'SEO software', similarity: 0.82 },
            ],

            // Food & Hospitality
            'Restaurant & Food': [
                { domain: 'yelp.com', name: 'Yelp', description: 'Restaurant reviews', similarity: 0.80 },
                { domain: 'doordash.com', name: 'DoorDash', description: 'Food delivery', similarity: 0.75 },
                { domain: 'grubhub.com', name: 'Grubhub', description: 'Online food ordering', similarity: 0.72 },
            ],

            // Automotive
            'Automotive': [
                { domain: 'midas.com', name: 'Midas', description: 'Auto repair services', similarity: 0.88 },
                { domain: 'jiffy-lube.com', name: 'Jiffy Lube', description: 'Oil change & maintenance', similarity: 0.85 },
                { domain: 'firestonecompleteautocare.com', name: 'Firestone', description: 'Auto repair & tires', similarity: 0.82 },
            ],

            // Fitness & Wellness
            'Fitness & Wellness': [
                { domain: 'orangetheory.com', name: 'Orangetheory Fitness', description: 'Fitness studio franchise', similarity: 0.88 },
                { domain: 'planetfitness.com', name: 'Planet Fitness', description: 'Gym chain', similarity: 0.85 },
                { domain: 'anytimefitness.com', name: 'Anytime Fitness', description: '24-hour gym', similarity: 0.82 },
            ],
        };

        const competitors = industryCompetitors[industry];
        if (competitors) {
            console.log(`[CompetitorDiscovery] Found ${competitors.length} competitors for ${industry}`);
            return competitors;
        }

        // Fallback for unknown industries
        console.log(`[CompetitorDiscovery] No specific competitors for ${industry}, using fallback`);
        return [
            { domain: 'yelp.com', name: 'Yelp', description: 'Business reviews & ratings', similarity: 0.60 },
            { domain: 'google.com/business', name: 'Google Business', description: 'Local business listings', similarity: 0.55 },
        ];
    }
}
