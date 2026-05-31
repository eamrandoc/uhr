import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import router from "./routes";
import notFound from "./middlewares/notFound";
import globalErrorHandler from "./middlewares/globalErrorHandler";


const app: Application = express();

// ======================
// 🔐 SECURITY FIRST
// ======================
app.use(helmet());

// ======================
// 🌐 CORS (must early)
// ======================
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

// ======================
// 🍪 PARSERS
// ======================
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// 📊 HEALTH CHECK
// ======================
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "UHR Fashion API is running 🚀",
    uptime: process.uptime().toFixed(2) + "s",
    timestamp: new Date().toISOString(),
  });
});

// ======================
// 🚀 ROUTES
// ======================
app.use("/api/v1", router);

// ======================
// ❌ NOT FOUND
// ======================
app.use(notFound);

// ======================
// ⚠️ GLOBAL ERROR
// ======================
app.use(globalErrorHandler);

export default app;