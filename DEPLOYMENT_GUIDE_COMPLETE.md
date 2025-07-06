# Complete StocksShorts App Deployment Guide

## Overview
This guide contains everything needed to recreate the StocksShorts Indian stock market news application from scratch.

## Required External Services & API Keys

### 1. Google Sheets API (For News Content)
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select existing
- Enable Google Sheets API
- Create service account credentials
- Download JSON key file
- Share your Google Sheets with the service account email

**Environment Variables:**
```env
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_ID=your_google_sheets_id_here
```

### 2. OpenAI API (For AI Stock Analysis)
- Sign up at [OpenAI Platform](https://platform.openai.com/)
- Generate API key from dashboard
- Add billing information

**Environment Variables:**
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Database (PostgreSQL)
- Use Replit's built-in PostgreSQL or external provider
- For external: Neon, Supabase, or Railway

**Environment Variables:**
```env
DATABASE_URL=postgresql://username:password@host:port/database
```

### 4. Session Secret
```env
SESSION_SECRET=your-random-session-secret-minimum-32-chars
```

## Google Sheets Structure

Create a Google Sheet with these exact column headers:

| Column | Header | Description |
|--------|--------|-------------|
| A | ID | Unique identifier |
| B | Title | Article title |
| C | Content | Article content |
| D | Type | Category (IPO, Research Report, etc.) |
| E | Time | Timestamp (YYYY-MM-DD HH:mm:ss) |
| F | Source | Source name |
| G | Sentiment | Positive/Negative/Neutral |
| H | Priority | High/Medium/Low |
| I | ImageURL | Image URL (optional) |
| J | Category | Article category |

### Sample Data Row:
```
ID: 1
Title: Market Update Today
Content: Indian markets showed strong performance...
Type: StocksShorts Special
Time: 2025-01-15 10:30:00
Source: StocksShorts
Sentiment: Positive
Priority: High
ImageURL: https://example.com/image.jpg
Category: Market News
```

## Complete Project Structure

```
project/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/ (shadcn components)
│   │   │   ├── CategoryFilter.tsx
│   │   │   ├── NewsCard.tsx
│   │   │   ├── BottomNavigation.tsx
│   │   │   └── Header.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Connect.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── Contact.tsx
│   │   │   └── AISection.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── lib/
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
├── server/
│   ├── services/
│   │   ├── googleSheets.ts
│   │   ├── authenticDataProvider.ts
│   │   └── authenticNewsService.ts
│   ├── db.ts
│   ├── storage.ts
│   ├── routes.ts
│   ├── mobileAuth.ts
│   ├── static-server.ts
│   ├── vite.ts
│   └── index.ts
├── shared/
│   └── schema.ts
├── attached_assets/ (for images)
├── .env
├── package.json
├── tailwind.config.ts
├── vite.config.ts
├── drizzle.config.ts
└── replit.md
```

## Key Configuration Files

### package.json
```json
{
  "name": "stocksshorts-clone",
  "version": "1.0.0",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "db:push": "drizzle-kit push:pg"
  },
  "dependencies": {
    "@google/genai": "^0.21.0",
    "@neondatabase/serverless": "^0.9.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@tanstack/react-query": "^5.0.0",
    "drizzle-orm": "^0.30.0",
    "express": "^4.18.0",
    "googleapis": "^134.0.0",
    "openai": "^4.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "wouter": "^3.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "drizzle-kit": "^0.20.0",
    "esbuild": "^0.19.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

### .replit Configuration
```ini
modules = ["nodejs-20", "web", "postgresql-16"]
run = "npm run dev"
hidden = [".config", ".git", "node_modules", "dist"]

[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]

[[ports]]
localPort = 5000
externalPort = 80
```

## Essential Code Files

### server/index.ts (Main Server)
```typescript
import express from "express";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { setupProductionStatic } from "./static-server";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  const server = await registerRoutes(app);
  
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    setupProductionStatic(app);
  }

  const port = process.env.PORT || 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
})();
```

### Database Schema (shared/schema.ts)
```typescript
import { pgTable, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer("id").primaryKey(),
  phoneNumber: varchar("phone_number", { length: 15 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const articles = pgTable("articles", {
  id: integer("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 100 }),
  source: varchar("source", { length: 200 }),
  sentiment: varchar("sentiment", { length: 50 }),
  priority: varchar("priority", { length: 20 }),
  imageUrl: varchar("image_url", { length: 500 }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

## Step-by-Step Setup

1. **Create Replit Project**
   - Fork this repository or create new Node.js project
   - Install dependencies: `npm install`

2. **Set up Google Sheets**
   - Create Google Cloud project
   - Enable Sheets API
   - Create service account
   - Download credentials JSON
   - Create your news spreadsheet with required columns

3. **Configure Environment Variables**
   - Add all environment variables in Replit Secrets
   - Or create `.env` file for local development

4. **Database Setup**
   - Use Replit's PostgreSQL or external provider
   - Run migrations: `npm run db:push`

5. **Deploy**
   - Push code to Replit
   - Use deployment feature for production

## Mobile Authentication Flow

The app uses OTP-based mobile authentication:
1. User enters Indian mobile number
2. 6-digit OTP sent via console (demo mode)
3. User verifies OTP
4. Account created/logged in

## API Endpoints

- `GET /api/articles` - Fetch news articles
- `GET /api/articles?category=IPO` - Filter by category
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/stock-ai/query` - AI stock analysis

## Customization Points

1. **Branding**: Update logo, colors, app name
2. **Categories**: Modify article categories in CategoryFilter
3. **Data Source**: Replace Google Sheets with your CMS
4. **Authentication**: Add social login or email auth
5. **AI Features**: Enhance with additional models
6. **Styling**: Customize Tailwind theme

## Production Deployment

1. Build: `npm run build`
2. Start: `npm run start`
3. Environment: Set `NODE_ENV=production`
4. Domain: Configure custom domain in Replit

## Important Notes

- Never share private keys publicly
- Use environment variables for all secrets
- Test thoroughly before production deployment
- Monitor API usage and costs
- Implement proper error handling
- Add logging for debugging

This guide provides everything needed to recreate the application. You'll need to obtain your own API keys and configure the services according to your requirements.