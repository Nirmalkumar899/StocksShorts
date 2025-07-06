import express from "express";
import path from "path";
import fs from "fs";
import { log } from "./vite";

export function setupProductionStatic(app: express.Express) {
  // When running from dist/index.js, the public directory is relative to the built server
  const publicDir = path.join(process.cwd(), "public");
  
  log(`Setting up production static serving from: ${publicDir}`);
  log(`Directory exists: ${fs.existsSync(publicDir)}`);
  
  if (!fs.existsSync(publicDir)) {
    throw new Error(`Production build directory not found: ${publicDir}`);
  }

  // Simple static file serving with priority order
  app.use(express.static(publicDir, {
    index: false, // Don't auto-serve index.html
    setHeaders: (res, filePath, stat) => {
      // Set proper MIME types
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
    }
  }));

  // SPA fallback - serve index.html for non-API routes
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    
    const indexPath = path.join(publicDir, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        log(`Error serving index.html: ${err.message}`);
        res.status(500).send("Error loading page");
      }
    });
  });
}