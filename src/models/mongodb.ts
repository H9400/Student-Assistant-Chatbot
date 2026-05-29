import mongoose from 'mongoose';

// MongoDB Atlas connection string (replace with your own)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/edubot';

// Connect to MongoDB
export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  preferences: {
    language: { type: String, default: 'en' },
    theme: { type: String, default: 'light' },
  },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
});

// Chat Message Schema
const messageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['user', 'bot'], required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    language: String,
    confidence: Number,
    topics: [String],
  },
});

// College Information Schema
const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    city: String,
    state: String,
    country: String,
  },
  courses: [{
    name: String,
    duration: String,
    description: String,
  }],
  facilities: [String],
  admissionCriteria: String,
  contactInfo: {
    email: String,
    phone: String,
    website: String,
  },
  lastUpdated: { type: Date, default: Date.now },
});

// Analytics Schema
const analyticsSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: String, required: true },
  eventType: { type: String, required: true },
  eventData: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
});

// Export models
export const User = mongoose.model('User', userSchema);
export const Message = mongoose.model('Message', messageSchema);
export const College = mongoose.model('College', collegeSchema);
export const Analytics = mongoose.model('Analytics', analyticsSchema);