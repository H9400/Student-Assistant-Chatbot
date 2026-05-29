import { webScraper } from './webScraper';
import { enhancedNLP } from './enhancedNLP';
import { educationalDataStore } from '../models/database';

interface EnhancedScrapedData {
    url: string;
    category: string;
    title: string;
    description: string;
    content: string;
    metadata: { [key: string]: string };
    nlpAnalysis: {
        topics: string[];
        keyPhrases: string[];
        sentiment: 'positive' | 'neutral' | 'negative';
        educationalLevel: string;
        subjectAreas: string[];
        relevanceScore: number;
    };
    lastUpdated: Date;
    status: 'success' | 'partial' | 'failed';
    error?: string;
}

class EnhancedScraper {
    private readonly educationalLevels = [
        'primary',
        'secondary',
        'high school',
        'undergraduate',
        'postgraduate',
        'doctorate',
        'professional'
    ];

    private readonly subjectAreas = [
        'engineering',
        'medical',
        'science',
        'arts',
        'commerce',
        'law',
        'management',
        'technology',
        'humanities',
        'social sciences'
    ];

    private async analyzeContent(text: string): Promise<EnhancedScrapedData['nlpAnalysis']> {
        try {
            const analysis = await enhancedNLP.processText(text, {
                lastTopic: '',
                mentionedEntities: [],
                history: []
            });

            // Extract educational level
            const educationalLevel = this.educationalLevels.find(level =>
                text.toLowerCase().includes(level)
            ) || 'general';

            // Extract subject areas
            const subjectAreas = this.subjectAreas.filter(subject =>
                text.toLowerCase().includes(subject.toLowerCase())
            );

            // Calculate relevance score based on educational keywords and context
            const relevanceScore = this.calculateRelevanceScore(text, analysis.entities);

            return {
                topics: analysis.entities.filter(entity => 
                    !this.educationalLevels.includes(entity.toLowerCase()) &&
                    !this.subjectAreas.includes(entity.toLowerCase())
                ),
                keyPhrases: this.extractKeyPhrases(text),
                sentiment: analysis.sentiment,
                educationalLevel,
                subjectAreas,
                relevanceScore
            };
        } catch (error) {
            console.error('Content analysis error:', error);
            return {
                topics: [],
                keyPhrases: [],
                sentiment: 'neutral',
                educationalLevel: 'general',
                subjectAreas: [],
                relevanceScore: 0
            };
        }
    }

    private calculateRelevanceScore(text: string, entities: string[]): number {
        const educationalKeywords = [
            'education', 'course', 'program', 'degree', 'college',
            'university', 'study', 'academic', 'scholarship', 'admission',
            'exam', 'curriculum', 'faculty', 'research', 'student'
        ];

        const keywordMatches = educationalKeywords.filter(keyword =>
            text.toLowerCase().includes(keyword)
        ).length;

        const entityRelevance = entities.length / 10; // Normalize to 0-1 range
        const keywordRelevance = keywordMatches / educationalKeywords.length;

        return Math.min((keywordRelevance + entityRelevance) / 2 * 100, 100);
    }

    private extractKeyPhrases(text: string): string[] {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const phrases = sentences.flatMap(sentence => {
            const words = sentence.trim().split(/\s+/);
            if (words.length <= 5) return [sentence.trim()];
            
            // Extract noun phrases and important segments
            return this.findImportantPhrases(words);
        });

        return [...new Set(phrases)].slice(0, 10); // Return top 10 unique phrases
    }

    private findImportantPhrases(words: string[]): string[] {
        const phrases: string[] = [];
        const importantPatterns = [
            'how to',
            'what is',
            'benefits of',
            'guide to',
            'introduction to',
            'understanding',
            'requirements for',
            'steps to',
            'tips for',
            'best practices'
        ];

        for (let i = 0; i < words.length - 2; i++) {
            const threeWordPhrase = words.slice(i, i + 3).join(' ').toLowerCase();
            if (importantPatterns.some(pattern => threeWordPhrase.includes(pattern))) {
                phrases.push(words.slice(i, i + 5).join(' '));
            }
        }

        return phrases;
    }

    public async processWithNLP(url: string, category: string): Promise<void> {
        try {
            const scrapedData = await webScraper.scrapeUrl(url);
            
            // Combine title, description, and content for comprehensive analysis
            const combinedText = [
                scrapedData.title,
                scrapedData.description,
                scrapedData.content
            ].join('\n');

            const nlpAnalysis = await this.analyzeContent(combinedText);

            const enhancedData: EnhancedScrapedData = {
                url,
                category,
                ...scrapedData,
                nlpAnalysis
            };

            await educationalDataStore.save(enhancedData);
            console.log(`Enhanced scraping completed for ${url}`);

        } catch (error) {
            console.error(`Enhanced scraping failed for ${url}:`, error);
            throw error;
        }
    }

    public async processQueueWithNLP(): Promise<void> {
        while (true) {
            const item = await educationalDataStore.getNextUnprocessed();
            if (!item) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                continue;
            }

            try {
                await this.processWithNLP(item.url, item.category);
                await educationalDataStore.markProcessed(item.url);
            } catch (error) {
                console.error(`Failed to process ${item.url}:`, error);
                await educationalDataStore.markFailed(item.url, error instanceof Error ? error.message : String(error));
            }

            // Respect rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

export const enhancedScraper = new EnhancedScraper();