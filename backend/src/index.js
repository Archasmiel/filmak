/**
 * Application entrypoint.
 * Responsibilities:
 *  - Load environment variables
 *  - Configure core middleware (CORS, JSON parsing)
 *  - Register infrastructure middleware (request logging)
 *  - Mount routes
 *  - Register 404 + error handlers (must be last)
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './logger/logger.js';
import requestLogger from './middleware/requestLogger.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import errorHandler from './middleware/errorHandler.js';

// .env
dotenv.config();

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());

// API request logging middleware
app.use(requestLogger);

// Test route
app.get('/api/hello', (req, res) => {
    res.json({ message: "Hello from backend!" });
});

// 404 (before, for precision) + other error handler
app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
    logger.info(`SERVER_START port=${port}`);
});