// Type definitions for scraper-related interfaces

export interface ScrapedData {
    title: string;
    description: string;
    content: string;
    metadata: { [key: string]: string };
    lastUpdated: Date;
    status: 'success' | 'partial' | 'failed';
    error?: string;
}

export interface SearchEngine {
    name: string;
    baseUrl: string;
    resultSelector: string;
    linkSelector: string;
    nextPageSelector?: string;
}

export interface DomainRule {
    contentSelector: string;
    dateSelector: string;
    importantSelectors: string[];
}

export interface ScrapingQueueItem {
    url: string;
    category: string;
    priority: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    failureCount: number;
    lastAttempt?: Date;
    error?: string;
}

export interface RateLimiter {
    tokens: number;
    lastRefill: number;
    refillRate: number;
    refillInterval: number;
}

export interface UrlCache {
    data: any;
    timestamp: number;
}

export interface SearchConfig {
    keywords: string[];
    searchEngines: SearchEngine[];
    maxPages: number;
}

export interface CategoryPatterns {
    [key: string]: RegExp;
}

export interface CategorizedUrls {
    college: string[];
    exam: string[];
    scholarship: string[];
    misc: string[];
    uncategorized: string[];
}