import dotenv from "dotenv";
dotenv.config();

// Ensure OpenAI client doesn't crash the server synchronously if key is forgotten in Vercel dashboard
if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = "missing_key_from_vercel_dashboard";
}

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupProductionStatic } from "./static-server";

// Force development mode for Replit preview
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
  console.log('No NODE_ENV set, defaulting to development mode');
}

// Handle Replit environment properly 
if (process.env.REPLIT_ENVIRONMENT === 'production') {
  process.env.NODE_ENV = 'production';
  console.log('Detected Replit production environment, using production mode');
} else if (process.env.REPLIT_DEPLOYMENT || process.env.REPLIT_CLUSTER) {
  process.env.NODE_ENV = 'development';
  console.log('Detected Replit environment, forcing development mode for external access');
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

// Add comprehensive error catching
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add comprehensive logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log('Request headers:', req.headers);
  next();
});

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

    // Add a health check route for external domains
    app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        port: process.env.PORT || 5000
      });
    });

    // Add a catch-all route for debugging
    app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`🔍 Request: ${req.method} ${req.path} from ${req.headers.host}`);
      next();
    });

    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error('🚨 DETAILED SERVER ERROR:', {
        errorName: err.name,
        errorMessage: err.message,
        errorCode: err.code,
        errorStack: err.stack,
        requestUrl: req.url,
        requestMethod: req.method,
        requestHost: req.headers.host,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        replitDeployment: process.env.REPLIT_DEPLOYMENT,
        replitCluster: process.env.REPLIT_CLUSTER
      });

      if (!res.headersSent) {
        res.status(status).json({
          message,
          timestamp: new Date().toISOString(),
          path: req.path,
          environment: process.env.NODE_ENV,
          error: err.message,
          details: status === 500 ? 'Check server logs for details' : 'Request failed'
        });
      }
    });

    // Setup static serving: Vite in dev, production build in all other environments
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      // Always serve production static files (works on both Vercel and bare Node.js)
      setupProductionStatic(app);
    }

    // Only bind to port in non-Vercel environments
    // Vercel handles listening automatically via the ESM default export
    if (!process.env.VERCEL) {
      const port = parseInt(process.env.PORT || '5000', 10);
      server.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    // Do NOT call process.exit(1) — in Vercel serverless, this kills the function
    // before it can return a response. Instead, add a fallback error handler.
    app.use((_req: Request, res: Response) => {
      res.status(500).json({
        error: 'Server initialization failed',
        message: error instanceof Error ? error.message : 'Unknown startup error',
        timestamp: new Date().toISOString()
      });
    });
  }
})();

// Export the app for Vercel serverless deployment
export default app;
