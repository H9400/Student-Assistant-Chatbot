import { EventEmitter } from 'events';

interface ErrorLog {
    timestamp: Date;
    type: string;
    message: string;
    stack?: string;
    context?: Record<string, any>;
}

class ErrorHandler extends EventEmitter {
    private static instance: ErrorHandler;
    private errorLogs: ErrorLog[] = [];
    private readonly MAX_LOGS = 1000;

    private constructor() {
        super();
        this.setupGlobalHandlers();
    }

    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    private setupGlobalHandlers() {
        process.on('uncaughtException', (error: Error) => {
            this.handleError('uncaughtException', error);
        });

        process.on('unhandledRejection', (reason: any) => {
            this.handleError('unhandledRejection', reason);
        });
    }

    public handleError(type: string, error: Error | any, context?: Record<string, any>) {
        const errorLog: ErrorLog = {
            timestamp: new Date(),
            type,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            context
        };

        this.errorLogs.push(errorLog);
        if (this.errorLogs.length > this.MAX_LOGS) {
            this.errorLogs.shift();
        }

        this.emit('error', errorLog);
        console.error(`[${type}] ${errorLog.message}`, {
            stack: errorLog.stack,
            context: errorLog.context
        });
    }

    public async handleScrapingError(url: string, error: Error | any, context?: Record<string, any>) {
        const errorLog: ErrorLog = {
            timestamp: new Date(),
            type: 'scraping_error',
            message: `Failed to scrape URL: ${url} - ${error instanceof Error ? error.message : String(error)}`,
            stack: error instanceof Error ? error.stack : undefined,
            context
        };

        this.errorLogs.push(errorLog);
        this.emit('scraping_error', errorLog);
    }

    public async handleProcessingError(data: any, error: Error | any, context?: Record<string, any>) {
        const errorLog: ErrorLog = {
            timestamp: new Date(),
            type: 'processing_error',
            message: `Failed to process data: ${error instanceof Error ? error.message : String(error)}`,
            stack: error instanceof Error ? error.stack : undefined,
            context: { ...context, data }
        };

        this.errorLogs.push(errorLog);
        this.emit('processing_error', errorLog);
    }

    public getRecentErrors(limit: number = 50): ErrorLog[] {
        return this.errorLogs.slice(-limit);
    }

    public clearLogs(): void {
        this.errorLogs = [];
    }
}

export const errorHandler = ErrorHandler.getInstance();