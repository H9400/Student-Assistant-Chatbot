import { EventEmitter } from 'events';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { webScraper } from './webScraper';

// cSpell:words shiksha collegedunia getmyuni aicte mciindia jeemain neet pnnext

interface SearchEngine {
    name: string;
    baseUrl: string;
    resultSelector: string;
    linkSelector: string;
    nextPageSelector?: string;
}

class AutoScraper extends EventEmitter {
    private searchConfigs = {
        keywords: [
            'top engineering colleges india',
            'best medical colleges',
            'entrance exam dates',
            'college admission process',
            'education scholarships india',
            'university rankings india',
            'JEE preparation',
            'NEET counselling',
            'college cutoff marks',
            'education news india',
            'top MBA colleges india',
            'law entrance exams',
            'engineering college placements',
            'medical college fees structure',
            'study abroad scholarships india'
        ],
        searchEngines: [
            {
                name: 'Google',
                baseUrl: 'https://www.google.com/search',
                resultSelector: 'div.g',
                linkSelector: 'a[href]',
                nextPageSelector: '#pnnext'
            },
            {
                name: 'DuckDuckGo',
                baseUrl: 'https://duckduckgo.com/html/',
                resultSelector: '.result',
                linkSelector: '.result__url'
            }
        ] as SearchEngine[],
        maxPages: 5
    };

    private targetDomains = [
        'shiksha.com',
        'collegedunia.com',
        'careers360.com',
        'getmyuni.com',
        'education.gov.in',
        'ugc.ac.in',
        'aicte-india.org',
        'mciindia.org',
        'jeemain.nta.nic.in',
        'neet.nta.nic.in'
    ];

    private domainRules: Record<string, {contentSelector: string; dateSelector: string; importantSelectors: string[]}> = {
        'shiksha.com': {
          contentSelector: '.article-content',
          dateSelector: '.article-date',
          importantSelectors: ['.highlight-box', '.important-note']
        },
        'collegedunia.com': {
          contentSelector: '.college-detail',
          dateSelector: '.updated-on',
          importantSelectors: ['.key-points', '.quick-facts']
        },
        'careers360.com': {
          contentSelector: '.article-body',
          dateSelector: '.publish-date',
          importantSelectors: ['.quick-links', '.summary-box']
        },
        'education.gov.in': {
          contentSelector: '#main-content',
          dateSelector: '.updated',
          importantSelectors: ['.notification', '.circular']
        }
    };

    private getDomainRules(domain: string): {contentSelector: string; dateSelector: string; importantSelectors: string[]} {
        return this.domainRules[domain] || {
            contentSelector: 'body',
            dateSelector: '',
            importantSelectors: []
        };
    };

    private urlCache = new Map<string, {data: any; timestamp: number}>();
    private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    private rateLimiter = {
        tokens: 100,
        lastRefill: Date.now(),
        refillRate: 10, // tokens per second
        refillInterval: 1000 // 1 second
    };

    private async getRateLimit(): Promise<boolean> {
        const now = Date.now();
        const timePassed = now - this.rateLimiter.lastRefill;
        const tokensToAdd = Math.floor(timePassed / this.rateLimiter.refillInterval) * this.rateLimiter.refillRate;

        if (tokensToAdd > 0) {
            this.rateLimiter.tokens = Math.min(100, this.rateLimiter.tokens + tokensToAdd);
            this.rateLimiter.lastRefill = now;
        }

        if (this.rateLimiter.tokens > 0) {
            this.rateLimiter.tokens--;
            return true;
        }
        return false;
    }

    private async searchAndQueue(keyword: string, engine: SearchEngine) {
        try {
            const cacheKey = `${engine.name}-${keyword}`;
            const cached = this.urlCache.get(cacheKey);

            if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                return cached.data;
            }

            if (!await this.getRateLimit()) {
                throw new Error('Rate limit exceeded');
            }

            const urls = new Set<string>();
            let page = 1;
            
            // Get domain rules for the search engine
            const engineDomain = new URL(engine.baseUrl).hostname;
            const domainRules = this.getDomainRules(engineDomain);

            while (page <= this.searchConfigs.maxPages) {
                const searchUrl = this.buildSearchUrl(engine.baseUrl, keyword, page);
                const response = await axios.get(searchUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                const $ = cheerio.load(response.data as string);
                const results = $(engine.resultSelector);

                results.each((_: number, element: cheerio.Element) => {
                    const link = $(element).find(engine.linkSelector).attr('href');
                    if (link && this.isRelevantUrl(link)) {
                        const normalizedUrl = this.normalizeUrl(link);
                        urls.add(normalizedUrl);
                        this.emit('urlDiscovered', normalizedUrl);
                    }

                    // Apply domain-specific content extraction if available
                    if (domainRules.importantSelectors.length > 0) {
                        domainRules.importantSelectors.forEach(selector => {
                            const importantContent = $(element).find(selector).text().trim();
                            if (importantContent) {
                                this.emit('importantContent', { url: link, content: importantContent });
                            }
                        });
                    }
                });

                if (!engine.nextPageSelector || !$(engine.nextPageSelector).length) {
                    break;
                }

                page++;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            const urlArray = Array.from(urls);
            const categorizedUrls = this.categorizeUrls(urlArray);
            
            for (const [category, urls] of Object.entries(categorizedUrls)) {
                try {
                    await webScraper.addToQueue(urls, category);
                    urls.forEach(url => this.emit('urlProcessed', url, true));
                } catch (error) {
                    urls.forEach(url => this.emit('urlProcessed', url, false));
                    console.error(`Error adding ${category} URLs to queue:`, error);
                }
            }

        } catch (error) {
            console.error(`Error searching ${keyword} on ${engine.name}:`, error);
        }
    }

    private buildSearchUrl(baseUrl: string, keyword: string, page: number): string {
        const params = new URLSearchParams({
            q: keyword,
            start: ((page - 1) * 10).toString()
        });
        return `${baseUrl}?${params.toString()}`;
    }

    private isRelevantUrl(url: string): boolean {
        return this.targetDomains.some(domain => url.includes(domain));
    }

    private normalizeUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            return urlObj.origin + urlObj.pathname;
        } catch {
            return url;
        }
    }

    private categorizeUrls(urls: string[]): { [key: string]: string[] } {
        const patterns = {
            college: /college|university|institute|admission|campus/i,
            exam: /exam|entrance|test|jee|neet/i,
            scholarship: /scholarship|financial-aid|fellowship/i
        };

        const categorized: { [key: string]: string[] } = {
            college: [],
            exam: [],
            scholarship: [],
            misc: []
        };

        for (const url of urls) {
            let matched = false;
            for (const [category, pattern] of Object.entries(patterns)) {
                if (pattern.test(url)) {
                    categorized[category].push(url);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                categorized.uncategorized.push(url);
            }
        }

        return categorized;
    }

    async startDiscovery(): Promise<void> {
        console.log('Starting URL discovery process...');
        
        for (const keyword of this.searchConfigs.keywords) {
            for (const engine of this.searchConfigs.searchEngines) {
                await this.searchAndQueue(keyword, engine);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        console.log('URL discovery process completed.');
    }

    async startPeriodicDiscovery(intervalHours = 24): Promise<void> {
        console.log(`Starting periodic discovery every ${intervalHours} hours...`);
        
        const run = async () => {
            await this.startDiscovery();
            setTimeout(run, intervalHours * 60 * 60 * 1000);
        };

        await run();
    }
}

export const autoScraper = new AutoScraper();

// Start the auto-scraper if this file is run directly
if (require.main === module) {
    autoScraper.startPeriodicDiscovery().catch(console.error);
}