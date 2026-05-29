import { TrainingData, connectDB } from '../src/models/database';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import csv from 'csv-parser';

interface TrainingRecord {
  question: string;
  answer: string;
  category: string;
  confidence?: number;
  source?: string;
}

async function processTrainingData(filePath: string) {
  const records: TrainingRecord[] = [];
  
  await pipeline(
    fs.createReadStream(filePath),
    csv(),
    async function*(data) {
      for await (const record of data) {
        yield record;
      }
    },
    async function(source) {
      for await (const record of source) {
        records.push({
          question: record.question,
          answer: record.answer,
          category: record.category,
          confidence: parseFloat(record.confidence) || 1.0,
          source: record.source || 'manual'
        });
      }
    }
  );

  return records;
}

async function importTrainingData(directoryPath: string) {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // Get all CSV files in the directory
    const files = fs.readdirSync(directoryPath)
      .filter(file => file.endsWith('.csv'));

    for (const file of files) {
      console.log(`Processing ${file}...`);
      const filePath = path.join(directoryPath, file);
      
      // Process the file
      const records = await processTrainingData(filePath);
      
      // Batch insert records
      const batchSize = 1000;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await TrainingData.insertMany(batch, {
          ordered: false,
          // Skip duplicates based on question
          skipDuplicates: true
        });
      }

      console.log(`Imported ${records.length} records from ${file}`);
    }

    // Create text index for searching
    await TrainingData.collection.createIndex(
      { question: 'text', answer: 'text' },
      { 
        weights: {
          question: 2,
          answer: 1
        },
        name: 'question_answer_text'
      }
    );

    console.log('Training data import completed successfully');
  } catch (error) {
    console.error('Error importing training data:', error);
  } finally {
    process.exit();
  }
}

// Usage
const trainingDataPath = process.argv[2] || path.join(__dirname, '../data/training');
importTrainingData(trainingDataPath); 