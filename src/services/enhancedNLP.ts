import { pipeline, AutoTokenizer, AutoModel } from '@huggingface/transformers';
import { detectLanguage } from './multilingual_processor';
import type { SemanticAnalysis, ConversationContext } from './nlpProcessor';

interface EntityInfo {
    text: string;
    type: string;
    confidence: number;
}

interface IntentInfo {
    intent: string;
    confidence: number;
}

interface SentimentInfo {
    label: 'positive' | 'neutral' | 'negative';
    score: number;
}

export class EnhancedNLPProcessor {
    private tokenizer: any;
    private model: any;
    private nerPipeline: any;
    private classificationPipeline: any;
    private sentimentPipeline: any;

    constructor() {
        this.initializeModels();
    }

    private async initializeModels() {
        try {
            // Initialize tokenizer and model for general text processing
            this.tokenizer = await AutoTokenizer.from_pretrained('bert-base-multilingual-cased');
            this.model = await AutoModel.from_pretrained('bert-base-multilingual-cased');

            // Initialize specialized pipelines
            this.nerPipeline = await pipeline('ner', 'dbmdz/bert-large-cased-finetuned-conll03-english');
            this.classificationPipeline = await pipeline('text-classification', 'facebook/bart-large-mnli');
            this.sentimentPipeline = await pipeline('sentiment-analysis', 'nlptown/bert-base-multilingual-uncased-sentiment');
        } catch (error) {
            console.error('Error initializing NLP models:', error);
            throw new Error('Failed to initialize NLP models');
        }
    }

    private async extractEntities(text: string): Promise<EntityInfo[]> {
        try {
            const entities = await this.nerPipeline(text);
            return entities.map((entity: any) => ({
                text: entity.word,
                type: entity.entity,
                confidence: entity.score
            }));
        } catch (error) {
            console.error('Entity extraction error:', error);
            return [];
        }
    }

    private async detectIntent(text: string): Promise<IntentInfo> {
        const intents = [
            'seek_information',
            'request_assistance',
            'express_concern',
            'provide_feedback',
            'schedule_request',
            'technical_query',
            'admission_query',
            'course_inquiry',
            'fee_structure',
            'placement_info'
        ];

        try {
            const results = await Promise.all(
                intents.map(intent =>
                    this.classificationPipeline(text, {
                        hypothesis: `This is a ${intent.replace('_', ' ')} request.`
                    })
                )
            );

            const bestMatch = results.reduce((prev, curr, idx) => {
                return curr.score > prev.score ? { intent: intents[idx], score: curr.score } : prev;
            }, { intent: intents[0], score: 0 });

            return {
                intent: bestMatch.intent,
                confidence: bestMatch.score
            };
        } catch (error) {
            console.error('Intent detection error:', error);
            return { intent: 'general', confidence: 0 };
        }
    }

    private async analyzeSentiment(text: string): Promise<SentimentInfo> {
        try {
            const result = await this.sentimentPipeline(text);
            return {
                label: result[0].label.toLowerCase() as 'positive' | 'neutral' | 'negative',
                score: result[0].score
            };
        } catch (error) {
            console.error('Sentiment analysis error:', error);
            return { label: 'neutral', score: 0.5 };
        }
    }

    private calculateUrgency(text: string, sentiment: SentimentInfo, intent: IntentInfo): number {
        const urgencyIndicators = [
            'urgent', 'immediate', 'asap', 'emergency', 'critical',
            'deadline', 'important', 'priority', 'quick', 'fast'
        ];

        const hasUrgentWords = urgencyIndicators.some(word => text.toLowerCase().includes(word));
        const exclamationCount = (text.match(/!/g) || []).length;
        const capsRatio = text.split('').filter(char => char >= 'A' && char <= 'Z').length / text.length;

        let urgencyScore = 0;
        if (hasUrgentWords) urgencyScore += 1;
        if (exclamationCount > 0) urgencyScore += Math.min(exclamationCount * 0.5, 1);
        if (capsRatio > 0.3) urgencyScore += 0.5;
        if (sentiment.label === 'negative' && sentiment.score > 0.7) urgencyScore += 0.5;
        if (intent.confidence > 0.8) urgencyScore += 0.5;

        return Math.min(urgencyScore, 3);
    }

    public async processText(text: string, context: ConversationContext): Promise<SemanticAnalysis> {
        try {
            // Detect language and translate if necessary
            const detectedLanguage = await detectLanguage(text);
            
            // Perform parallel processing of different aspects
            const [entities, intentInfo, sentimentInfo] = await Promise.all([
                this.extractEntities(text),
                this.detectIntent(text),
                this.analyzeSentiment(text)
            ]);

            const urgency = this.calculateUrgency(text, sentimentInfo, intentInfo);

            // Consider context for better understanding
            const contextualEntities = [
                ...new Set([
                    ...entities.map(e => e.text),
                    ...context.mentionedEntities.slice(-5)
                ])
            ];

            return {
                intent: intentInfo.intent,
                urgency,
                sentiment: sentimentInfo.label,
                entities: contextualEntities,
                temporalReference: this.determineTemporalContext(text)
            };
        } catch (error) {
            console.error('Error in text processing:', error);
            throw new Error('Failed to process text');
        }
    }

    private determineTemporalContext(text: string): 'past' | 'present' | 'future' {
        const futureIndicators = ['will', 'going to', 'tomorrow', 'next', 'upcoming', 'future'];
        const pastIndicators = ['was', 'were', 'had', 'yesterday', 'last', 'previous', 'ago'];

        const textLower = text.toLowerCase();
        if (futureIndicators.some(indicator => textLower.includes(indicator))) return 'future';
        if (pastIndicators.some(indicator => textLower.includes(indicator))) return 'past';
        return 'present';
    }
}

export const enhancedNLP = new EnhancedNLPProcessor();