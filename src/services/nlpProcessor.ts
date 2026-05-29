import nlp from 'compromise';
import sentences from 'compromise-sentences';
import dates from 'compromise-dates';

// Add type declaration for compromise-dates
declare module 'compromise-dates' {
  interface NlpExtension {
    dates(): any;
  }
}

nlp.extend(sentences);
nlp.extend(dates);

export interface ConversationContext {
  lastTopic?: string;
  mentionedEntities: string[];
  history: string[];
}

export interface SemanticAnalysis {
  intent: string;
  urgency: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  entities: string[];
  temporalReference?: 'past' | 'present' | 'future';
}

export function processInput(text: string, context: ConversationContext): SemanticAnalysis {
  const doc = nlp(text);
  
  // Add context usage example
  const contextKeywords = context.history.length > 0 ? 
    ` Context keywords: ${context.mentionedEntities.join(', ')}` : '';
  
  // Entity extraction
  const entities = [
    ...doc.people().out('array'),
    ...doc.organizations().out('array'),
    ...doc.places().out('array'),
    ...(doc as any).dates().out('array')
  ];

  // Intent detection
  let intent = 'general';
  if (doc.has('(create|add|make) #Noun')) intent = 'create_task';
  if (doc.has('(remind|remember) me')) intent = 'set_reminder';
  if (doc.has('(how|what) #Adverb? (do|about)')) intent = 'seek_advice';

  // Sentiment analysis
  const sentiment = doc.sentences().json()[0].sentiment;
  const sentimentScore = sentiment.score > 0 ? 'positive' : sentiment.score < 0 ? 'negative' : 'neutral';

  // Temporal analysis
  const tense = doc.sentences().terms(0).tag('PastTense') ? 'past' :
    doc.sentences().terms(0).tag('FutureTense') ? 'future' : 'present';

  // Urgency detection
  const urgencyTerms = doc.match('#Adverb (urgent|important|critical)').length;
  const urgencyExclamation = (text.match(/!/g) || []).length;
  const urgency = Math.min(urgencyTerms + urgencyExclamation, 3);

  return {
    intent,
    urgency: urgency + (contextKeywords ? 1 : 0),
    sentiment: sentimentScore,
    entities: [...new Set(entities)],
    temporalReference: tense
  };
}

export function updateContext(context: ConversationContext, text: string, analysis: SemanticAnalysis): ConversationContext {
  return {
    lastTopic: analysis.entities[0] || context.lastTopic,
    mentionedEntities: [...new Set([...context.mentionedEntities, ...analysis.entities])],
    history: [...context.history.slice(-4), text],
  };
} 