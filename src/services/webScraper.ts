import axios from 'axios';
import * as cheerio from 'cheerio';
import { scrapingQueue, educationalDataStore } from '../models/database';
import { ScrapedData } from '../types/scraper';
import { errorHandler } from './errorHandler';

// Constants for configuration
const SCRAPING_CONFIG = {
    RATE_LIMIT_DELAY: 2000, // 2 seconds between requests
    REQUEST_TIMEOUT: 10000, // 10 seconds timeout
    MAX_CONTENT_LENGTH: 1000, // Maximum length for extracted content
    RETRY_ATTEMPTS: 3 // Number of retry attempts for failed requests
};

export class WebScraper {
    private lastRequestTime = 0;
    private retryCount = new Map<string, number>();

    private async enforceRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
            await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();
    }

    private async scrapeUrl(url: string): Promise<ScrapedData> {
        await this.enforceRateLimit();
        const currentRetries = this.retryCount.get(url) || 0;

        try {
            if (currentRetries >= SCRAPING_CONFIG.RETRY_ATTEMPTS) {
                throw new Error(`Max retry attempts (${SCRAPING_CONFIG.RETRY_ATTEMPTS}) reached for URL: ${url}`);
            }

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                timeout: SCRAPING_CONFIG.REQUEST_TIMEOUT,
                maxRedirects: 5,
                validateStatus: (status) => status >= 200 && status < 300
            });

            if (!response.data) {
                throw new Error('Empty response received');
            }

            // Reset retry count on successful request
            this.retryCount.delete(url);

            const $ = cheerio.load(response.data as string);
            let status: ScrapedData['status'] = 'success';
            let error: string | undefined;
            
            // Extract and validate title
            let title = $('h1').first().text().trim() || 
                      $('title').text().trim() ||
                      $('meta[property="og:title"]').attr('content') || '';
            
            if (!title) {
                status = 'partial';
                error = 'Title extraction failed';
                title = url.split('/').pop() || 'Untitled';
            }

            // Extract and validate description
            let description = $('meta[name="description"]').attr('content') ||
                           $('meta[property="og:description"]').attr('content') ||
                           $('p').first().text().trim() || '';
            
            if (!description) {
                status = 'partial';
                error = (error ? error + '; ' : '') + 'Description extraction failed';
            }

            // Extract main content with improved selectors
            const contentSelectors = [
                'article',
                '.content',
                '.main-content',
                'main',
                '#content',
                '.post-content',
                '.entry-content'
            ];

            let content = '';
            for (const selector of contentSelectors) {
                const element = $(selector);
                if (element.length) {
                    content = element
                        .text()
                        .trim()
                        .replace(/\s+/g, ' ');
                    break;
                }
            }

            if (!content) {
                status = 'partial';
                error = (error ? error + '; ' : '') + 'Content extraction failed';
                content = $('body').text().trim().replace(/\s+/g, ' ').slice(0, 1000);
            }

            // Extract and validate metadata
            const metadata: { [key: string]: string } = {};
            $('meta').each((_: number, el: cheerio.Element) => {
                const name = $(el).attr('name') || $(el).attr('property');
                const content = $(el).attr('content');
                if (name && content && !name.includes('csrf') && !name.includes('token')) {
                    metadata[name] = content.trim();
                }
            });

            // Validate and sanitize the extracted content
            content = content.slice(0, SCRAPING_CONFIG.MAX_CONTENT_LENGTH);
            content = content.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters

            const scrapedData: ScrapedData = {
                title: title.trim(),
                description: description.trim(),
                content: content.trim(),
                metadata,
                lastUpdated: new Date(),
                status,
                error
            };

            return scrapedData;
        } catch (error) {
            // Increment retry count
            this.retryCount.set(url, currentRetries + 1);

            // Log error with context
            await errorHandler.handleScrapingError(url, error, {
                retryAttempt: currentRetries + 1,
                maxRetries: SCRAPING_CONFIG.RETRY_ATTEMPTS
            });

            throw new Error(`Failed to scrape URL: ${url} - ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async addToQueue(urls: string[], category: string): Promise<void> {
        for (const url of urls) {
            await scrapingQueue.add(url, category);
        }
    }

    async processQueue(): Promise<void> {
        while (true) {
            const item = await scrapingQueue.getNext();
            if (!item) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                continue;
            }

            try {
                await scrapingQueue.updateStatus(item.url, 'processing');
                const scrapedData = await this.scrapeUrl(item.url);
                
                await educationalDataStore.save({
                    url: item.url,
                    category: item.category,
                    ...scrapedData
                });

                await scrapingQueue.updateStatus(item.url, 'completed');
            } catch (error) {
                await scrapingQueue.updateStatus(item.url, 'failed', error instanceof Error ? error.message : String(error));
            }

            // Respect robots.txt with delay
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

export const webScraper = new WebScraper();