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
            CREATE TABLE IF NOT EXISTS public.users ( -- <<< ADDED 'public.' here
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                resetpasswordtoken TEXT,
                resetpasswordexpires TEXT
            );
        `);
    console.log("Users table creation query sent.");
    await pool.query(`
            CREATE TABLE IF NOT EXISTS public.tasks ( -- <<< ADDED 'public.' here
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE -- <<< AND HERE
            );
        `);
    console.log("Tasks table creation query sent.");
    console.log("PostgreSQL tables checked/created.");
  } catch (err) {
    console.error("Error creating tables:", err);
  }
})();

module.exports = db;
