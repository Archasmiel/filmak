const db = require("../db");
let fetch;
import('node-fetch').then(module => {
    fetch = module.default;
}).catch(err => {
    console.error("Failed to load node-fetch:", err);
});

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500"; 

exports.fetchPopularMoviesFromTmdb = async () => {
  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY is not defined in environment variables.");
    return [];
  }
  
  const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=uk-UA&page=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB API call failed with status: ${response.status}`);
    }
    const data = await response.json();
    
    const movies = data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path ? `${POSTER_BASE_URL}${movie.poster_path}` : null,
      overview: movie.overview || "no overview available",
    }));

    return movies;
  } catch (error) {
    console.error("Error fetching popular movies from TMDB:", error.message);
    return [];
  }
};

exports.saveOrUpdateMovies = async (movies) => {
  if (movies.length === 0) {
    return;
  }

  const client = await db.query('BEGIN'); 
  try {
    let updateCount = 0;
    
    for (const movie of movies) {
      const query = `
        INSERT INTO public.movies (id, title, poster_path, overview) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) 
        DO UPDATE SET 
            title = EXCLUDED.title,
            poster_path = EXCLUDED.poster_path,
            overview = EXCLUDED.overview,
            updated_at = CURRENT_TIMESTAMP
        WHERE public.movies.updated_at < CURRENT_TIMESTAMP - INTERVAL '1 hour';
      `;
      
      const result = await db.query(query, [
        movie.id,
        movie.title,
        movie.poster_path,
        movie.overview,
      ]);
      
      if (result.rowCount > 0) {
        updateCount++;
      }
    }
    
    await db.query('COMMIT'); 
    console.log(`Successfully processed and saved/updated ${updateCount} movies.`);
    return { success: true, count: updateCount };
  } catch (error) {
    await db.query('ROLLBACK'); 
    console.error("Error saving/updating movies to DB:", error.message);
    throw error;
  }
};



exports.getMoviesFromLocalDb = async () => {
  try {
    const result = await db.query(
      `
        SELECT 
            m.id, 
            m.title, 
            m.poster_path, 
            m.overview, 
            m.created_at,
            -- Real-time count of Likes (reaction_type = 1)
            COALESCE(SUM(CASE WHEN mr.reaction_type = 1 THEN 1 ELSE 0 END), 0) AS likes_count,
            -- Real-time count of Dislikes (reaction_type = -1)
            COALESCE(SUM(CASE WHEN mr.reaction_type = -1 THEN 1 ELSE 0 END), 0) AS dislikes_count
        FROM public.movies m
        LEFT JOIN public.movie_reactions mr ON m.id = mr.movie_id
        GROUP BY m.id, m.title, m.poster_path, m.overview, m.created_at
        ORDER BY m.created_at DESC
      `
    );
    return result.rows;
  } catch (error) {
    console.error("Error retrieving movies from local DB:", error.message);
    throw error;
  }
};

exports.getMovieById = async (movieId) => {
    try {
        const result = await db.query(
            `
              SELECT 
                  m.id, 
                  m.title, 
                  m.poster_path, 
                  m.overview, 
                  m.created_at,
                  COALESCE(SUM(CASE WHEN mr.reaction_type = 1 THEN 1 ELSE 0 END), 0) AS likes_count,
                  COALESCE(SUM(CASE WHEN mr.reaction_type = -1 THEN 1 ELSE 0 END), 0) AS dislikes_count,
                  (SELECT COUNT(*) FROM public.movie_comments WHERE movie_id = m.id) AS comments_count
              FROM public.movies m
              LEFT JOIN public.movie_reactions mr ON m.id = mr.movie_id
              WHERE m.id = $1
              GROUP BY m.id, m.title, m.poster_path, m.overview, m.created_at
            `,
            [movieId]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error("Error retrieving movie by ID from local DB:", error.message);
        throw error;
    }
};

exports.refreshMovieData = async () => {
    try {
        console.log("Starting movie data refresh...");
        const tmdbMovies = await exports.fetchPopularMoviesFromTmdb();
        if (tmdbMovies.length > 0) {
            await exports.saveOrUpdateMovies(tmdbMovies);
            console.log("Movie data refresh completed.");
        } else {
            console.log("No new movies fetched from TMDB.");
        }
    } catch (error) {
        console.error("Failed to refresh movie data:", error.message);
    }
}


exports.setReaction = async (movieId, userId, reactionType) => {
    const query = `
        INSERT INTO public.movie_reactions (movie_id, user_id, reaction_type)
        VALUES ($1, $2, $3)
        ON CONFLICT (movie_id, user_id) 
        DO UPDATE SET reaction_type = $3, created_at = CURRENT_TIMESTAMP
        RETURNING id;
    `;
    const result = await db.query(query, [movieId, userId, reactionType]);
    return result.rows[0];
};

exports.deleteReaction = async (movieId, userId) => {
    const query = `
        DELETE FROM public.movie_reactions
        WHERE movie_id = $1 AND user_id = $2
        RETURNING id;
    `;
    const result = await db.query(query, [movieId, userId]);
    return result.rowCount > 0;
};

exports.addComment = async (movieId, userId, content) => {
    const query = `
        INSERT INTO public.movie_comments (movie_id, user_id, content)
        VALUES ($1, $2, $3)
        RETURNING id, created_at;
    `;
    const result = await db.query(query, [movieId, userId, content]);
    return result.rows[0];
};

exports.updateComment = async (commentId, userId, content) => {
    const query = `
        UPDATE public.movie_comments
        SET content = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING id, updated_at;
    `;
    const result = await db.query(query, [content, commentId, userId]);
    return result.rows[0]; 
};

exports.deleteComment = async (commentId, userId) => {
    const query = `
        DELETE FROM public.movie_comments
        WHERE id = $1 AND user_id = $2
        RETURNING id;
    `;
    const result = await db.query(query, [commentId, userId]);
    return result.rowCount > 0;
};

exports.getCommentsByMovie = async (movieId) => {
    const query = `
        SELECT 
            mc.id, 
            mc.content, 
            mc.created_at, 
            mc.updated_at,
            mc.user_id,
            u.name as user_name,
            u.email as user_email
        FROM public.movie_comments mc
        JOIN public.users u ON mc.user_id = u.id
        WHERE mc.movie_id = $1
        ORDER BY mc.created_at ASC;
    `;
    const result = await db.query(query, [movieId]);
    return result.rows;
};