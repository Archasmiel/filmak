require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const movieService = require("./services/movie.service");

const app = express();
const PORT = process.env.PORT || 5000;

// === CORS Configuration ===
const allowedOrigins = ["http://localhost:3000"];

app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(
        new Error(`CORS policy blocked this origin: ${origin}`)
      );
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

app.use(express.json());

// === Route Definitions ===
app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/movies", require("./routes/movie.route"));

// === Health Check ===
app.get("/healthz", (req, res) => {
  res.send("API is running...");
});

// === Global Error Handler ===
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// === Connect DB & Start Server ===
db.on("open", () => {
  app.listen(PORT, async () => {
    console.log(
      `Server running at http://localhost:${PORT} [${
        process.env.NODE_ENV || "development"
      } mode]`
    );

    await movieService.refreshMovieData();
  });
});
