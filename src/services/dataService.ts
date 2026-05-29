import { User, Message, College, Analytics, connectDB } from '../models/mongodb';
import { Cache } from '../models/cache';

export class DataService {
  constructor() {
    // Initialize database connection
    connectDB();
  }

  // User Management
  async createUser(userData: any) {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserById(userId: string) {
    try {
      // Check cache first
      const cachedUser = await Cache.getUserSession(userId);
      if (cachedUser) return cachedUser;

      // If not in cache, get from database
      const user = await User.findOne({ userId });
      if (user) {
        await Cache.setUserSession(userId, user);
      }
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Message Management
  async saveMessage(messageData: any) {
    try {
      const message = new Message(messageData);
      await message.save();

      // Update chat history in cache
      const cachedHistory = await Cache.getChatHistory(messageData.sessionId) || [];
      cachedHistory.push(message);
      await Cache.setChatHistory(messageData.sessionId, cachedHistory);

      return message;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async getChatHistory(sessionId: string) {
    try {
      // Check cache first
      const cachedHistory = await Cache.getChatHistory(sessionId);
      if (cachedHistory) return cachedHistory;

      // If not in cache, get from database
      const messages = await Message.find({ sessionId }).sort({ timestamp: 1 });
      await Cache.setChatHistory(sessionId, messages);
      return messages;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  }

  // College Information Management
  async saveCollege(collegeData: any) {
    try {
      const college = new College(collegeData);
      await college.save();
      
      // Update cache
      await Cache.setCollegeData(college._id, college);
      return college;
    } catch (error) {
      console.error('Error saving college:', error);
      throw error;
    }
  }

  async getCollegeById(collegeId: string) {
    try {
      // Check cache first
      const cachedCollege = await Cache.getCollegeData(collegeId);
      if (cachedCollege) return cachedCollege;

      // If not in cache, get from database
      const college = await College.findById(collegeId);
      if (college) {
        await Cache.setCollegeData(collegeId, college);
      }
      return college;
    } catch (error) {
      console.error('Error fetching college:', error);
      throw error;
    }
  }

  async searchColleges(query: any) {
    try {
      const colleges = await College.find(query);
      return colleges;
    } catch (error) {
      console.error('Error searching colleges:', error);
      throw error;
    }
  }

  // Analytics Management
  async trackEvent(eventData: any) {
    try {
      const analytics = new Analytics(eventData);
      await analytics.save();

      // Cache analytics data
      const cacheKey = `${eventData.eventType}:${eventData.sessionId}`;
      await Cache.setAnalytics(cacheKey, eventData);

      return analytics;
    } catch (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  }

  async getAnalytics(query: any) {
    try {
      const analytics = await Analytics.find(query);
      return analytics;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }
}

export const dataService = new DataService();