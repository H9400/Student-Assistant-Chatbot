import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { autoScraper } from '../services/autoScraper';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Serve static files
app.use(express.static(path.join(__dirname)));

interface DashboardStats {
    urlsDiscovered: number;
    urlsProcessed: number;
    successCount: number;
    failureCount: number;
    startTime: number;
    categoryDistribution: {
        college: number;
        exam: number;
        scholarship: number;
        uncategorized: number;
    };
}

// Dashboard stats
let stats: DashboardStats = {
    urlsDiscovered: 0,
    urlsProcessed: 0,
    successCount: 0,
    failureCount: 0,
    startTime: Date.now(),
    categoryDistribution: {
        college: 0,
        exam: 0,
        scholarship: 0,
        uncategorized: 0
    }
};

// WebSocket connection handling
io.on('connection', (socket: Socket) => {
    console.log('Client connected');
    socket.emit('stats', getStats());

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Auto-scraper event handling
autoScraper.on('urlDiscovered', (url: string) => {
    stats.urlsDiscovered++;
    io.emit('activity', {
        time: Date.now(),
        event: 'URL Discovered',
        url,
        status: 'info'
    });
    io.emit('stats', getStats());
});

autoScraper.on('urlProcessed', (url: string, success: boolean) => {
    stats.urlsProcessed++;
    if (success) {
        stats.successCount++;
    } else {
        stats.failureCount++;
    }

    // Update category distribution
    const category = getCategoryFromUrl(url);
    if (category in stats.categoryDistribution) {
        stats.categoryDistribution[category as keyof typeof stats.categoryDistribution]++;
    }

    io.emit('activity', {
        time: Date.now(),
        event: 'URL Processed',
        url,
        status: success ? 'success' : 'failure'
    });
    io.emit('stats', getStats());
});

function getStats() {
    const runningTime = Math.floor((Date.now() - stats.startTime) / 1000 / 60);
    const successRate = stats.urlsProcessed > 0
        ? ((stats.successCount / stats.urlsProcessed) * 100).toFixed(2)
        : '0.00';

    return {
        ...stats,
        runningTime: `${runningTime}m`,
        successRate: `${successRate}%`
    };
}

function getCategoryFromUrl(url: string): keyof typeof stats.categoryDistribution {
    const patterns = {
        college: /college|university|institute|admission|campus/i,
        exam: /exam|entrance|test|jee|neet/i,
        scholarship: /scholarship|financial-aid|fellowship/i
    };

    for (const [category, pattern] of Object.entries(patterns)) {
        if (pattern.test(url)) {
            return category as keyof typeof stats.categoryDistribution;
        }
    }
    return 'uncategorized';
}

// Start server
const PORT = process.env.DASHBOARD_PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Dashboard server running on port ${PORT}`);
}); 