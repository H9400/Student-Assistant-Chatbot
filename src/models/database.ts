import mongoose from 'mongoose';

// Chat History Schema
const chatMessageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  sessionId: { type: String, required: true },
  message: { type: String, required: true },
  isUser: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
  language: { type: String, default: 'en' },
  context: {
    entities: [String],
    intent: String,
    sentiment: Number
  }
});

// Educational Data Schema
const educationalDataSchema = new mongoose.Schema({
  type: { type: String, required: true }, // college, course, exam, scholarship
  name: { type: String, required: true },
  description: String,
  content: { type: String, default: '' },
  lastUpdated: { type: Date, default: Date.now },
  source: { type: String, required: true },
  sourceUrl: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'outdated'],
    default: 'pending'
  }
});

// Web Scraping Queue Schema
const scrapingQueueSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  priority: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  lastAttempt: Date,
  nextAttempt: Date,
  failureCount: { type: Number, default: 0 },
  dataType: { type: String, required: true }, // college, course, exam, etc.
  metadata: mongoose.Schema.Types.Mixed
});

// Training Data Schema
const trainingDataSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, required: true },
  source: String,
  confidence: Number,
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  lastUpdated: { type: Date, default: Date.now }
});

// Create models
export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export const EducationalData = mongoose.model('EducationalData', educationalDataSchema);
export const ScrapingQueueModel = mongoose.model('ScrapingQueue', scrapingQueueSchema);
export const TrainingData = mongoose.model('TrainingData', trainingDataSchema);

// Database connection function
export const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/educational_chatbot');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

interface ScrapingQueueItem {
    url: string;
    category: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    attempts: number;
    lastAttempt?: Date;
    error?: string;
}

interface EducationalDataItem {
    url: string;
    category: string;
    title: string;
    description: string;
    content: string;
    metadata: Record<string, any>;
    lastUpdated: Date;
}

export class ScrapingQueueService {
    async add(url: string, category: string): Promise<void> {
        await ScrapingQueueModel.create({
            url,
            status: 'pending',
            dataType: category,
            failureCount: 0
        });
    }

    async getNext(): Promise<ScrapingQueueItem | null> {
        const item = await ScrapingQueueModel.findOne({ status: 'pending' });
        if (!item) return null;
        
        return {
            url: item.url,
            category: item.dataType,
            status: item.status as ScrapingQueueItem['status'],
            attempts: item.failureCount,
            lastAttempt: item.lastAttempt ? new Date(item.lastAttempt) : undefined
        };
    }

    async updateStatus(url: string, status: ScrapingQueueItem['status'], error?: string): Promise<void> {
        const update: any = {
            status,
            lastAttempt: new Date(),
            $inc: { failureCount: 1 }
        };
        
        if (error) {
            update.metadata = { error };
        }
        
        await ScrapingQueueModel.findOneAndUpdate({ url }, update);
    }
}

export class EducationalDataService {
    async save(data: Omit<EducationalDataItem, 'lastUpdated'>): Promise<void> {
        await EducationalData.create({
            type: data.category,
            name: data.title,
            description: data.description,
            content: data.content,
            source: data.url,
            metadata: data.metadata
        });
    }

    async findByUrl(url: string): Promise<EducationalDataItem | null> {
        const item = await EducationalData.findOne({ source: url });
        if (!item) return null;
        
        return {
            url: item.source,
            category: item.type,
            title: item.name,
            description: item.description || '',
            content: item.content || '',
            metadata: item.metadata instanceof Map ? Object.fromEntries(item.metadata) : {},
            lastUpdated: item.lastUpdated
        };
    }

    async findByCategory(category: string): Promise<EducationalDataItem[]> {
        const items = await EducationalData.find({ type: category });
        return items.map(item => ({
            url: item.source,
            category: item.type,
            title: item.name,
            description: item.description || '',
            content: item.content || '',
            metadata: item.metadata instanceof Map ? Object.fromEntries(item.metadata) : {},
            lastUpdated: item.lastUpdated
        }));
    }
}

export const scrapingQueue = new ScrapingQueueService();
export const educationalDataStore = new EducationalDataService();

// Connect to MongoDB when this module is imported
connectDB();