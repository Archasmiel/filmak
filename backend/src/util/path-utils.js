/**
 * Path utilities for resolving project-root locations.
 * - Exports `projectRoot` and `logDir`.
 *
 * Production notes:
 * - LOG_DIR can be absolute or relative to the backend project root.
 * - This file is used by logger configuration to place logs outside src/.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// projectRoot is the backend folder (two levels up from src/util)
export const projectRoot = path.resolve(__dirname, '..', '..');

// Resolve LOG_DIR env or default to backend/logs
export const logDir = (() => {
  const envDir = process.env.LOG_DIR;
  if (envDir) {
    return path.isAbsolute(envDir) ? envDir : path.join(projectRoot, envDir);
  }
  const defaultDir = path.join(projectRoot, 'logs');
  // ensure folder exists
  if (!fs.existsSync(defaultDir)) fs.mkdirSync(defaultDir, { recursive: true });
  return defaultDir;
})();