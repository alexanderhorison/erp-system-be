require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const router = require("./routers");
const { sequelize } = require("./models");

const app = express();
const port = process.env.PORT;

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Disposition"],
  credentials: true,
};
app.use(cors(corsOptions));

// enabling the Helmet middleware
app.use(helmet());
app.use(express.json({ limit: '10mb', }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint with DB connectivity
app.get("/api/health", async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: port,
    uptime: Math.floor(process.uptime()),
    env: process.env.NODE_ENV || "development",
  };

  try {
    await sequelize.authenticate();
    health.database = "connected";
  } catch (error) {
    health.status = "unhealthy";
    health.database = "disconnected";
    return res.status(503).json(health);
  }

  res.status(200).json(health);
});

app.use("/api", router);

const server = app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

// Graceful shutdown
function gracefulShutdown(signal) {
  console.log(`${signal} received. Starting graceful shutdown...`);
  server.close(async () => {
    try {
      await sequelize.close();
      console.log("Database connections closed");
    } catch (err) {
      console.error("Error closing database connections:", err.message);
    }
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error.message);
  process.exit(1);
});
