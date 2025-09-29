/**
 * Application entrypoint.
 * - Loads environment variables
 * - Configures core middleware (CORS, JSON parsing, cookies)
 * - Registers infrastructure middleware (request logging)
 * - Mounts routes
 * - Registers 404 + centralized error handlers (must be last)
 *
 * Notes for production:
 * - Ensure FRONTEND_ORIGIN or similar env is set correctly for CORS.
 * - Use https + proper cookie settings (secure=true) in production.
 * - Keep middleware order: logging -> routes -> 404 -> errorHandler
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import process from 'process';
import logger from './logger/logger.js';
import { 
    requestLogger, 
    notFoundHandler, 
    errorHandler 
} from './middleware/middleware.js';
import authRoutes from './routes/auth.js';

// .env
dotenv.config();

const app = express();

// Core middleware
app.use(cors({
  origin: 'http://localhost:5173', // todo: change in production
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// API request logging middleware
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use(notFoundHandler);

// Central error handler (last middleware)
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
    logger.info(`SERVER_START port=${port}`);
});