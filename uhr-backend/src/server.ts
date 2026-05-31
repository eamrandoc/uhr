import http, { Server } from "http";
import config from "./config";
import app from "./app/app";


// =========================
// 🪵 Simple Logger (replace with winston/pino in real prod)
// =========================
const logger = {
  info: (msg: string) => console.log(`ℹ️ ${msg}`),
  warn: (msg: string) => console.warn(`⚠️ ${msg}`),
  error: (msg: string, err?: any) => console.error(`❌ ${msg}`, err || ""),
};

// =========================
// 🚨 Process-wide handlers
// =========================
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", err);
  shutdown("uncaughtException", 1);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection", err);
  shutdown("unhandledRejection", 1);
});

// =========================
// 🌐 Server instance
// =========================
let server: Server;

// =========================
// 🚀 Start Server
// =========================
const startServer = () => {
  server = http.createServer(app);

  server.listen(config.port, () => {
    logger.info(`Server running at http://localhost:${config.port}`);
  });

  server.on("error", (err) => {
    logger.error("Server error", err);
    shutdown("server_error", 1);
  });
};

// =========================
// 🧹 Graceful Shutdown (Single Source of Truth)
// =========================
const shutdown = (signal: string, exitCode: number = 0) => {
  logger.warn(`${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(exitCode);
    });

    // Force shutdown after timeout (prevents hanging)
    setTimeout(() => {
      logger.error("Forced shutdown due to timeout");
      process.exit(1);
    }, 10000);
  } else {
    process.exit(exitCode);
  }
};

// =========================
// 📡 OS Signals
// =========================
process.on("SIGINT", () => shutdown("SIGINT", 0));  // Ctrl + C
process.on("SIGTERM", () => shutdown("SIGTERM", 0)); // Docker/K8s

// =========================
// ▶️ Bootstrap
// =========================
startServer();