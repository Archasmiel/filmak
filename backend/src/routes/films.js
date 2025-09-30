/**
 * Films REST resource (skeleton).
 * TODO: Replace with real persistence layer and validation.
 */
import express from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middlewares/middleware.js';

// Temporary in-memory store (not for production)
const films = new Map();

// Seed example
const seedId = crypto.randomUUID();
films.set(seedId, { id: seedId, title: 'Sample Film', year: 2024, createdAt: new Date().toISOString() });

const router = express.Router();

// GET /films -> list
router.get('/', (req, res) => {
  res.json({ items: Array.from(films.values()) });
});

// GET /films/:id -> detail
router.get('/:id', (req, res) => {
  const film = films.get(req.params.id);
  if (!film) return res.status(404).json({ error: 'Not Found' });
  res.json(film);
});

// POST /films -> create (auth required)
router.post('/', requireAuth, (req, res) => {
  const { title, year } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const id = crypto.randomUUID();
  const film = { id, title, year: year || null, createdAt: new Date().toISOString(), owner: req.user.sub };
  films.set(id, film);
  res.status(201).json(film);
});

// DELETE /films/:id -> delete (auth required, simple owner check)
router.delete('/:id', requireAuth, (req, res) => {
  const film = films.get(req.params.id);
  if (!film) return res.status(404).json({ error: 'Not Found' });
  if (film.owner && film.owner !== req.user.sub) return res.status(403).json({ error: 'Forbidden' });
  films.delete(req.params.id);
  res.status(204).end();
});

export default router;