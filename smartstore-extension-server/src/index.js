import "dotenv/config";
import express from "express";
import cors from "cors";
import { createLogger, format, transports } from "winston";
import routes from "./routes/index.js";

// Logger configuration
const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.File({ filename: process.env.LOG_FILE }),
    new transports.Console(),
  ],
});

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Chrome Extension ID와 localhost 모두 허용
    const allowedOrigins = [
      "chrome-extension://ojekopppamoakdhhllhhaleeapaobakj", // extension ID
      "http://localhost:3000",
    ];

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// CORS 미들웨어 적용
app.use(cors(corsOptions));

// preflight 요청을 위한 OPTIONS 핸들러 추가
app.options("*", cors(corsOptions));

app.use(express.json());

// 모든 라우트에 CORS 헤더 추가
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "chrome-extension://ojekopppamoakdhhllhhaleeapaobakj",
  );
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With",
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  next();
});

// Routes
app.use("/api", routes);

// Error handling
app.use((err, req, res, next) => {
  logger.error("Error:", err);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
