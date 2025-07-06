# StocksShorts Application Backup

This is a complete backup of the StocksShorts application created on January 6, 2025.

## Backup Contents

### Core Application Files
- `client/` - Frontend React application with TypeScript
- `server/` - Backend Express.js server with authentication and API routes
- `shared/` - Shared TypeScript schemas and types
- `attached_assets/` - All image assets and media files

### Configuration Files
- `package.json` - Project dependencies and scripts
- `package-lock.json` - Dependency lock file
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `drizzle.config.ts` - Database configuration
- `components.json` - shadcn/ui component configuration

### Documentation
- `replit.md` - Project documentation and user preferences
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `DNS_SETUP.md` - DNS configuration guide
- `GOOGLE_SEARCH_CONSOLE_SETUP.md` - SEO setup guide
- `MULTI_PLATFORM_VISIBILITY_STRATEGY.md` - Marketing strategy
- `VISITOR_TRACKING_GUIDE.md` - Analytics setup guide

## Key Features Backed Up

### Frontend Features
- React 18 with TypeScript
- Responsive mobile-first design
- Category-based news filtering
- Dark mode support
- Real-time article updates
- Google Analytics integration
- SEO optimization
- PWA capabilities

### Backend Features
- Express.js API server
- Mobile OTP authentication
- Google Sheets integration
- PostgreSQL database with Drizzle ORM
- AI-powered stock analysis
- Investment advisor directory
- Article translation capabilities

### Authentication System
- Mobile number-based OTP verification
- Session management
- User profile management
- Protected routes

### Data Sources
- Google Sheets for article content
- Real-time stock data APIs
- OpenAI for AI analysis
- SEBI RIA directory

## Restoration Instructions

1. **Prerequisites:**
   - Node.js 20+
   - PostgreSQL database
   - Google Sheets API credentials
   - OpenAI API key

2. **Setup:**
   ```bash
   cd stocksshorts-backup
   npm install
   ```

3. **Environment Variables:**
   Set up the following environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `GOOGLE_CLIENT_EMAIL` - Google service account email
   - `GOOGLE_PRIVATE_KEY` - Google service account private key
   - `GOOGLE_SHEETS_ID` - Google Sheets spreadsheet ID
   - `OPENAI_API_KEY` - OpenAI API key
   - `FAST2SMS_API_KEY` - SMS service API key

4. **Database Setup:**
   ```bash
   npm run db:push
   ```

5. **Development:**
   ```bash
   npm run dev
   ```

6. **Production:**
   ```bash
   npm run build
   npm run start
   ```

## Architecture Overview

- **Frontend:** React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Express.js + TypeScript + Drizzle ORM
- **Database:** PostgreSQL
- **Authentication:** Mobile OTP-based
- **External APIs:** Google Sheets, OpenAI, Stock data providers
- **Deployment:** Replit with auto-scaling

## Security Features

- XSS vulnerability protection in Google Analytics
- Input validation and sanitization
- Secure session management
- Environment variable protection
- API rate limiting

## Last Updated
January 6, 2025 - Complete application backup including all features and security fixes.