import { EducationalData, ChatMessage, TrainingData } from '../models/database';

interface QueryContext {
  entities: string[];
  intent: string;
  language: string;
  timestamp: Date;
}

class KnowledgeService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_DURATION = 1800000; // 30 minutes

  async getResponse(query: string, context: QueryContext) {
    try {
      // 1. Check chat history for similar queries
      const similarQueries = await this.findSimilarQueries(query);
      
      // 2. Search educational data
      const educationalData = await this.searchEducationalData(context.entities);
      
      // 3. Get training data responses
      const trainingResponses = await this.getTrainingResponses(query, context.intent);
      
      // 4. Combine and rank responses
      const rankedResponses = this.rankResponses(
        query,
        similarQueries,
        educationalData,
        trainingResponses
      );

      // 5. Store the interaction
      await this.storeInteraction(query, rankedResponses[0], context);

      return rankedResponses[0];
    } catch (error) {
      console.error('Error in knowledge service:', error);
      throw error;
    }
  }

  private async findSimilarQueries(query: string) {
    const cacheKey = `similar_${query}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const similarQueries = await ChatMessage.find({
      $text: { $search: query },
      isUser: true
    })
      .sort({ score: { $meta: 'textScore' } })
      .limit(5)
      .lean();

    this.cache.set(cacheKey, {
      data: similarQueries,
      timestamp: Date.now()
    });

    return similarQueries;
  }

  private async searchEducationalData(entities: string[]) {
    const cacheKey = `edu_${entities.sort().join('_')}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await EducationalData.find({
      $or: [
        { name: { $in: entities } },
        { 'metadata.courses': { $in: entities } },
        { 'metadata.examinations': { $in: entities } }
      ],
      verificationStatus: 'verified'
    }).lean();

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  private async getTrainingResponses(query: string, intent: string) {
    const cacheKey = `training_${intent}_${query}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const responses = await TrainingData.find({
      category: intent,
      verificationStatus: 'verified',
      $text: { $search: query }
    })
      .sort({ confidence: -1 })
      .limit(3)
      .lean();

    this.cache.set(cacheKey, {
      data: responses,
      timestamp: Date.now()
    });

    return responses;
  }

  private rankResponses(
    query: string,
    similarQueries: any[],
    educationalData: any[],
    trainingResponses: any[]
  ) {
    // Combine all responses
    const allResponses = [
      ...trainingResponses.map(r => ({
        ...r,
        score: r.confidence * 1.2 // Boost verified training data
      })),
      ...educationalData.map(d => ({
        ...d,
        score: 1.0 // Base score for educational data
      })),
      ...similarQueries.map((q, i) => ({
        ...q,
        score: 0.8 - (i * 0.1) // Decreasing score for similar queries
      }))
    ];

    // Sort by score
    return allResponses.sort((a, b) => b.score - a.score);
  }

  private async storeInteraction(query: string, response: any, context: QueryContext) {
    await ChatMessage.create({
      userId: 'system', // Replace with actual user ID
      sessionId: 'session', // Replace with actual session ID
      message: query,
      isUser: true,
      language: context.language,
      context: {
        entities: context.entities,
        intent: context.intent
      }
    });

    await ChatMessage.create({
      userId: 'system',
      sessionId: 'session',
      message: response.answer || response.description,
      isUser: false,
      language: context.language,
      context: {
        entities: context.entities,
        intent: context.intent
      }
    });
  }

  // Method to invalidate cache entries
  invalidateCache(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

export const knowledgeService = new KnowledgeService(); 