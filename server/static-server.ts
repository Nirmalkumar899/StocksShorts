import express from "express";
import path from "path";
import fs from "fs";
import { log } from "./vite";

export function setupProductionStatic(app: express.Express) {
  // When running from dist/index.js, the public directory is in dist/public
  const publicDir = path.join(process.cwd(), "dist", "public");
  
  log(`Setting up production static serving from: ${publicDir}`);
  log(`Directory exists: ${fs.existsSync(publicDir)}`);
  
  if (!fs.existsSync(publicDir)) {
    // Fallback to check if public directory exists in current directory
    const fallbackDir = path.join(process.cwd(), "public");
    log(`Checking fallback directory: ${fallbackDir}`);
    
    if (fs.existsSync(fallbackDir)) {
      log(`Using fallback directory: ${fallbackDir}`);
      return setupStaticFromDirectory(app, fallbackDir);
    }
    
    throw new Error(`Production build directory not found: ${publicDir} or ${fallbackDir}`);
  }

  setupStaticFromDirectory(app, publicDir);
}

function setupStaticFromDirectory(app: express.Express, staticDir: string) {
  // Simple static file serving with priority order
  app.use(express.static(staticDir, {
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
    
    const indexPath = path.join(staticDir, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        log(`Error serving index.html: ${err.message}`);
        res.status(500).send("Error loading page");
      }
    });
  });
}