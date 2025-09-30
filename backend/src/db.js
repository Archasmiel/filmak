const { Pool } = require("pg");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is missing!");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Utility wrapper for PostgreSQL
const db = {
  query: (text, params) => pool.query(text, params),

  on: (event, callback) => {
    if (event === "open") {
      pool
        .connect()
        .then((client) => {
          console.log("Connected to PostgreSQL");
          client.release();
          if (callback) callback();
        })
        .catch((err) => {
          console.error("PostgreSQL connection error:", err.message);
          if (callback) callback(err);
        });
    } else if (event === "error") {
      pool.on("error", (err) => {
        console.error("Unexpected PostgreSQL error:", err.message);
        if (callback) callback(err);
      });
    }
  },
};

// Create tables if they don't exist
(async () => {
  try {
    console.log("Attempting to create tables...");
    await pool.query(`
            CREATE TABLE IF NOT EXISTS public.users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
        `);
    console.log("Users table creation query sent.");
    await pool.query(`
        CREATE TABLE IF NOT EXISTS public.movies (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            poster_path TEXT,
            overview TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log("Movies table creation query sent.");
    await pool.query(`
        CREATE TABLE IF NOT EXISTS public.movie_reactions (
            id SERIAL PRIMARY KEY,
            movie_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            reaction_type INTEGER NOT NULL CHECK (reaction_type IN (1, -1)),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (movie_id, user_id), 

            FOREIGN KEY (movie_id) REFERENCES public.movies(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
        );
    `);
    console.log("Movie Reactions table creation query sent.");
    await pool.query(`
            CREATE TABLE IF NOT EXISTS public.movie_comments (
                id SERIAL PRIMARY KEY,
                movie_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (movie_id) REFERENCES public.movies(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
            );
        `);
    console.log("Movie Comments table creation query sent.");
  } catch (err) {
    console.error("Error creating tables:", err);
  }
})();

module.exports = db;
