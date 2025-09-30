const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movie.controller");
const authMiddleware = require("../middleware/auth.middleware"); 

// GET /api/movies - Retrieves list of movies
router.get("/", authMiddleware, movieController.getMovies);

// GET /api/movies/:movieId - Retrieves details of a single movie
router.get("/:movieId", authMiddleware, movieController.getMovie);

// POST /api/movies/:movieId/reaction - Add, change, or remove a user reaction (Like/Dislike)
// Body: { type: 'like' | 'dislike' | 'remove' }
router.post("/:movieId/reaction", authMiddleware, movieController.handleReaction);

// GET /api/movies/:movieId/comments - Retrieve all comments for a movie
router.get("/:movieId/comments", authMiddleware, movieController.getComments);

// POST /api/movies/:movieId/comments - Add a new comment
// Body: { content: string }
router.post("/:movieId/comments", authMiddleware, movieController.addComment);

// PUT /api/movies/:movieId/comments/:commentId - Update user's own comment
// Body: { content: string }
router.put("/:movieId/comments/:commentId", authMiddleware, movieController.updateComment);

// DELETE /api/movies/:movieId/comments/:commentId - Delete user's own comment
router.delete("/:movieId/comments/:commentId", authMiddleware, movieController.deleteComment);

module.exports = router;