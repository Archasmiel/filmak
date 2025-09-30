const movieService = require("../services/movie.service");

/**
 * Helper to ensure movieId is a valid number.
 */
const getMovieId = (req) => {
    const movieId = parseInt(req.params.movieId, 10);
    if (isNaN(movieId)) {
        const error = new Error("Invalid movie ID format.");
        error.status = 400;
        throw error;
    }
    return movieId;
};


/**
 * GET /api/movies
 * Retrieves all movies from the local database (Existing function).
 */
exports.getMovies = async (req, res) => {
  try {
    let movies = await movieService.getMoviesFromLocalDb();

    // If the local DB is empty, trigger an immediate refresh to populate it
    if (movies.length === 0) {
        console.log("Local movie database is empty. Triggering immediate refresh from TMDB...");
        await movieService.refreshMovieData();
        // Try fetching again
        movies = await movieService.getMoviesFromLocalDb();
    }

    res.json(movies);
  } catch (err) {
    console.error("Error retrieving movies:", err.message);
    res.status(500).json({ error: "Server error during movie retrieval." });
  }
};

/**
 * GET /api/movies/:movieId
 * Retrieves a single movie by ID from the local database.
 */
exports.getMovie = async (req, res) => {
    try {
        const movieId = getMovieId(req);
        const movie = await movieService.getMovieById(movieId);

        if (!movie) {
            return res.status(404).json({ error: "Movie not found in local database." });
        }

        res.json(movie);
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ error: err.message });
        }
        console.error("Error retrieving single movie:", err.message);
        res.status(500).json({ error: "Server error retrieving movie details." });
    }
};


/**
 * POST /api/movies/:movieId/reaction
 * Handles adding, changing, or removing a user's reaction (Like/Dislike).
 * Body: { type: 'like' | 'dislike' | 'remove' }
 */
exports.handleReaction = async (req, res) => {
    try {
        const movieId = getMovieId(req);
        const userId = req.user.id; 
        const { type } = req.body; // 'like', 'dislike', or 'remove'
        
        let reactionType;
        if (type === 'like') {
            reactionType = 1; // Like
        } else if (type === 'dislike') {
            reactionType = -1; // Dislike
        } else if (type === 'remove') {
            // If type is 'remove', delete the existing reaction
            const deleted = await movieService.deleteReaction(movieId, userId);
            if (!deleted) {
                return res.status(404).json({ error: "Reaction not found or already removed." });
            }
            return res.json({ message: "Reaction removed successfully." });
        } else {
             return res.status(400).json({ error: "Invalid reaction type. Must be 'like', 'dislike', or 'remove'." });
        }

        // Add or update reaction (like/dislike)
        const reaction = await movieService.setReaction(movieId, userId, reactionType);
        res.json({ message: `Reaction set to ${type} successfully.`, reactionId: reaction.id });

    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ error: err.message });
        }
        console.error("Error handling movie reaction:", err.message);
        res.status(500).json({ error: "Server error during reaction update." });
    }
};

/**
 * GET /api/movies/:movieId/comments
 * Retrieves all comments for a specific movie.
 */
exports.getComments = async (req, res) => {
    try {
        const movieId = getMovieId(req);
        const comments = await movieService.getCommentsByMovie(movieId);
        res.json(comments);
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ error: err.message });
        }
        console.error("Error retrieving movie comments:", err.message);
        res.status(500).json({ error: "Server error retrieving comments." });
    }
};

/**
 * POST /api/movies/:movieId/comments
 * Adds a new comment.
 * Body: { content: string }
 */
exports.addComment = async (req, res) => {
    try {
        const movieId = getMovieId(req);
        const userId = req.user.id;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: "Comment content cannot be empty." });
        }
        
        const newComment = await movieService.addComment(movieId, userId, content);
        res.status(201).json({ 
            message: "Comment added successfully.", 
            commentId: newComment.id, 
            createdAt: newComment.created_at 
        });

    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ error: err.message });
        }
        console.error("Error adding comment:", err.message);
        res.status(500).json({ error: "Server error adding comment." });
    }
};

/**
 * PUT /api/movies/:movieId/comments/:commentId
 * Updates an existing comment. Користувач може редагувати свої коментарі.
 * Body: { content: string }
 */
exports.updateComment = async (req, res) => {
    try {
        getMovieId(req);
        const commentId = parseInt(req.params.commentId, 10);
        const userId = req.user.id;
        const { content } = req.body;

        if (isNaN(commentId)) {
            return res.status(400).json({ error: "Invalid comment ID format." });
        }
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: "Comment content cannot be empty." });
        }

        const updatedComment = await movieService.updateComment(commentId, userId, content);

        if (!updatedComment) {
            return res.status(404).json({ error: "Comment not found or user not authorized to edit." });
        }

        res.json({ 
            message: "Comment updated successfully.", 
            commentId: updatedComment.id, 
            updatedAt: updatedComment.updated_at 
        });

    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ error: err.message });
        }
        console.error("Error updating comment:", err.message);
        res.status(500).json({ error: "Server error updating comment." });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        getMovieId(req);
        const commentId = parseInt(req.params.commentId, 10);
        const userId = req.user.id;

        if (isNaN(commentId)) {
            return res.status(400).json({ error: "Invalid comment ID format." });
        }

        const deleted = await movieService.deleteComment(commentId, userId);

        if (!deleted) {
            return res.status(404).json({ error: "Comment not found or user not authorized to delete." });
        }

        res.json({ message: "Comment deleted successfully." });

    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ error: err.message });
        }
        console.error("Error deleting comment:", err.message);
        res.status(500).json({ error: "Server error deleting comment." });
    }
};
