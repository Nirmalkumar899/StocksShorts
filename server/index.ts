import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupProductionStatic } from "./static-server";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Force development mode for Replit preview
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
  console.log('No NODE_ENV set, defaulting to development mode');
}

// Add deployment timeout handling and optimizations
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  // Set shorter timeouts for production deployment
  process.env.DB_TIMEOUT = '3000';
  process.env.REQUEST_TIMEOUT = '10000';
  
  // Deployment memory optimizations
  process.env.NODE_OPTIONS = '--max-old-space-size=512';
  
  // Disable unnecessary features for deployment
  process.env.VITE_DEV_TOOLS = 'false';
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session middleware
const MemStore = MemoryStore(session);
app.use(session({
  secret: process.env.SESSION_SECRET || 'stocksshorts-dev-secret-key-2025',
  store: new MemStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log('Starting server initialization...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('PORT:', process.env.PORT);
    
    const server = await registerRoutes(app);
    console.log('Routes registered successfully');

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Server error details:', {
      error: err,
      stack: err.stack,
      url: req.url,
      method: req.method,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
    
    if (!res.headersSent) {
      res.status(status).json({ 
        message,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    setupProductionStatic(app);
  }

    // Use environment port for Replit deployment, fallback to 5000 for local development
    const port = process.env.PORT || 5000;
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
