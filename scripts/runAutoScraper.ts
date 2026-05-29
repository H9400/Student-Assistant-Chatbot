import { autoScraper } from '../src/services/autoScraper';
import { connectDB } from '../src/models/database';
import { createLogger, format, transports } from 'winston';

// Configure logger
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'logs/auto-scraper-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/auto-scraper.log' }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

async function main() {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('Connected to MongoDB successfully');

    // Start monitoring
    const startTime = Date.now();
    let urlsDiscovered = 0;
    let urlsProcessed = 0;

    // Monitor URL discovery
    autoScraper.on('urlDiscovered', (url: string) => {
      urlsDiscovered++;
      logger.info(`Discovered URL: ${url}`);
    });

    // Monitor URL processing
    autoScraper.on('urlProcessed', (url: string, success: boolean) => {
      urlsProcessed++;
      if (success) {
        logger.info(`Successfully processed URL: ${url}`);
      } else {
        logger.error(`Failed to process URL: ${url}`);
      }
    });

    // Start auto-discovery with custom interval (6 hours)
    autoScraper.startPeriodicDiscovery(6);
    logger.info('Auto-scraper started successfully');

    // Print statistics periodically
    setInterval(() => {
      const runningTime = (Date.now() - startTime) / 1000 / 60; // minutes
      logger.info('Auto-scraper Statistics:', {
        runningTime: `${Math.round(runningTime)} minutes`,
        urlsDiscovered,
        urlsProcessed,
        successRate: `${((urlsProcessed / urlsDiscovered) * 100).toFixed(2)}%`
      });
    }, 300000); // Every 5 minutes

  } catch (error) {
    logger.error('Auto-scraper failed to start:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('Shutting down auto-scraper...');
  // Cleanup code here (if needed)
  process.exit(0);
});

// Start the auto-scraper
main(); 