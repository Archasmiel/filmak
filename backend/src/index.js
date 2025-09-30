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
} from './middlewares/middleware.js';
import authRoutes from './routes/auth.js';
import filmsRoutes from './routes/films.js';
import { API_PREFIX } from './config/api.js';

// .env
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Core middleware
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5173'),
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// API request logging middleware
app.use(requestLogger);

// Health (K8s / Compose friendly)
app.get('/healthz', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), ts: Date.now() });
});

// Versioned REST routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/films`, filmsRoutes);

// 404 handler
app.use(notFoundHandler);

// Central error handler (last middleware)
app.use(errorHandler);

app.listen(port, () => {
    logger.info(`SERVER_START port=${port}`);
});