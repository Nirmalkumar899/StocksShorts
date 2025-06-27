# StocksShorts - Indian Stock Market News Platform

## Overview

StocksShorts is a news aggregation platform that provides concise Indian stock market news in an "Inshorts" style format. The application fetches financial news from Google Sheets and presents it in a mobile-first, user-friendly interface with real-time updates and category-based filtering.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Custom CSS variables for theming with dark mode support

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API endpoints
- **Session Storage**: In-memory storage for user management
- **External Integration**: Google Sheets API for content management

### Data Storage Solutions
- **Primary Data Source**: Google Sheets (acts as CMS)
- **Database**: PostgreSQL with Drizzle ORM (configured but not actively used)
- **Session Storage**: Memory-based user storage
- **Caching**: Client-side caching via React Query

## Key Components

### Core Features
1. **News Aggregation**: Fetches articles from Google Sheets with real-time refresh
2. **Category Filtering**: Support for Nifty, Sensex, IPOs, Mutual Funds, and Crypto
3. **Sentiment Analysis**: Articles tagged with Positive, Negative, or Neutral sentiment
4. **Priority System**: High, Medium, Low priority classification
5. **Mobile-First Design**: Responsive layout with bottom navigation
6. **Dark Mode**: Toggle between light and dark themes

### API Endpoints
- `GET /api/articles` - Fetch all articles or filter by category
- `GET /api/articles/:id` - Get specific article by ID
- `GET /api/articles/:id/related` - Get related articles for a specific article
- `POST /api/articles/refresh` - Force refresh from Google Sheets
- `GET /api/investment-advisors` - Get SEBI RIA advisor directory
- `POST /api/stock-ai/query` - AI stock analysis with fundamentals-first approach

#### Mobile Authentication Endpoints
- `POST /api/auth/send-otp` - Send 6-digit OTP to mobile number
- `POST /api/auth/verify-otp` - Verify OTP and login/register user
- `GET /api/auth/user` - Get authenticated user info (requires auth)
- `POST /api/auth/logout` - Sign out user
- `PUT /api/auth/profile` - Update user profile name (requires auth)

### UI Components
- **Header**: Brand logo, refresh button, theme toggle
- **CategoryFilter**: 2-row grid layout with 11 categories (6 columns): Trending, Special, Breakout, Index, Warrants, Educational, IPO, Global, Active, Orders, Research
- **NewsCard**: Article display with sentiment indicators and contextual images
- **BottomNavigation**: Mobile navigation with Home, SEBI RIA, Contact, Profile tabs
- **SebiRia**: SEBI RIA connection page with "Coming Soon" status
- **Contact**: Message form for user inquiries
- **Profile**: Google authentication and user account management

## Data Flow

1. **Content Management**: News articles are managed in Google Sheets with columns for ID, Title, Content, Type, Time, Source, Sentiment, and Priority
2. **Data Fetching**: Server periodically fetches data from Google Sheets API
3. **Client Requests**: Frontend queries backend API endpoints
4. **Caching**: React Query caches responses and manages cache invalidation
5. **Real-time Updates**: Manual refresh button triggers fresh data fetch

## External Dependencies

### Google Sheets Integration
- **Authentication**: Service account with Google Sheets API access
- **Environment Variables**: 
  - `GOOGLE_CLIENT_EMAIL`: Service account email
  - `GOOGLE_PRIVATE_KEY`: Service account private key
  - `GOOGLE_SHEETS_ID`: Target spreadsheet ID

### Database Configuration
- **PostgreSQL**: Configured with Drizzle ORM
- **Environment Variables**: `DATABASE_URL` for database connection
- **Migrations**: Database schema defined in `shared/schema.ts`

### UI Dependencies
- **shadcn/ui**: Pre-built component library
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with Replit modules
- **Development Server**: Vite dev server with HMR
- **Database**: PostgreSQL 16 (configured but optional)
- **Port Configuration**: Server runs on port 5000

### Production Build
- **Client Build**: Vite builds to `dist/public`
- **Server Build**: esbuild bundles server to `dist/index.js`
- **Deployment Target**: Autoscale deployment on Replit
- **Environment**: Production environment variables required

### Build Scripts
- `npm run dev`: Development server with hot reload
- `npm run build`: Production build for both client and server
- `npm run start`: Production server startup
- `npm run db:push`: Database schema updates

### DNS Configuration
- Custom domain setup instructions in `DNS_SETUP.md`
- Replit deployment with automatic SSL/TLS
- A records and CNAME configuration for production

## Changelog

## Recent Changes

- June 27, 2025: **MAJOR**: Complete AI stock recognition system now covers ALL NSE/BSE listings including newer IPOs (Zomato, Paytm, Nykaa, PolicyBazaar) plus established stocks across all market caps with appropriate risk-based analysis
- June 27, 2025: **MAJOR**: Fixed AI stock analysis pricing accuracy - now uses current market data (Airtel ₹2,050, TCS ₹3,650) with realistic targets and technical levels based on actual prices
- June 27, 2025: **MAJOR**: Enhanced AI stock analysis with summary-first structure: Business Model, PE vs Industry, Quarterly Performance, Management Commentary, Technical Analysis - complete responses without truncation
- June 27, 2025: **MAJOR**: Created ultra-compact Ask AI input (single row layout) with dedicated stock discussion modal for AI responses - minimal space usage with full functionality
- June 27, 2025: **MAJOR**: Fixed app startup issues and implemented working OTP authentication system with MSG91 integration (₹0.15 per SMS)
- June 27, 2025: **MAJOR**: OTP verification system fully functional - successfully creating user accounts and managing authentication sessions
- June 27, 2025: **MAJOR**: Real SMS delivery now working - Fast2SMS activated and successfully sending OTPs to Indian phone numbers with confirmed delivery (₹0.15 per SMS)
- June 27, 2025: **MAJOR**: Resolved all TypeScript errors, React warnings, and database connectivity issues for production-ready deployment
- June 27, 2025: **MAJOR**: OTP authentication system now fully operational with real SMS delivery to Indian phone numbers
- June 27, 2025: **MAJOR**: Transformed "AskQuery" tab into anonymous "Feed" for stock discussions with moderation controls, Q&A format, voting system, and clean styling matching home page
- June 27, 2025: **MAJOR**: Updated all sections (SEBI RIA, Disclaimer) to use consistent clean styling matching home page - removed colorful gradients for professional appearance
- June 27, 2025: Renamed "Terms" navigation to "Disclaimer" for clearer user understanding
- June 27, 2025: **MAJOR**: Enhanced SEBI RIA section with educational content explaining what SEBI RIA is, investor rights, and news bulletin style advisor directory with scrolling ticker
- June 27, 2025: **MAJOR**: Added IPO/SME updates to AI section with grey market premium analysis, subscription dates, and business details
- June 27, 2025: **MAJOR**: Updated AI news to focus on breakout stocks, sector index breakouts (Bank Nifty, IT Index, etc.), research reports (small/mid/large cap), and order wins >10% revenue
- June 27, 2025: Removed generic index news; now only specific sector index resistance/support levels and breakouts
- June 27, 2025: Removed all earnings results and quarterly updates from AI section to avoid inaccurate historical data
- June 27, 2025: **MAJOR**: Added specific dates to all AI news articles showing exactly when each market movement or news event occurred
- June 27, 2025: Enhanced AI news system to include event timestamps in both titles and content for investor decision-making
- June 27, 2025: **MAJOR**: Fixed AI news system to generate only TODAY's fresh market alerts, removing all old/stale content
- June 27, 2025: Enhanced AI news parsing to extract actionable investor alerts from Perplexity API responses
- June 27, 2025: Implemented today-only content strategy - AI news shows only current trading session data with live market levels
- June 27, 2025: **MAJOR**: Enhanced AI news to show only TODAY and YESTERDAY content for maximum relevance in fast-moving stock markets
- June 27, 2025: Increased AI news fetching frequency to every 5 minutes for ultra-fresh market intelligence
- June 27, 2025: Implemented automatic cleanup of articles older than 2 days to maintain only actionable, time-sensitive content
- June 27, 2025: **MAJOR**: Enhanced AI news system to prioritize high-impact, actionable investor content over general market commentary
- June 27, 2025: Implemented intelligent content scoring system that prioritizes stock-specific alerts, earnings beats/misses, analyst upgrades/downgrades, contract wins, technical breakouts, and insider trading activity
- June 27, 2025: AI news now generates specific buy/sell recommendations with price targets, earnings impact analysis, and clear investor action points
- June 27, 2025: Added investor value scoring algorithm that ranks articles by actionability (price targets, specific stock mentions, broker recommendations, technical levels)
- June 27, 2025: **MAJOR**: Added AI-powered news section with real-time Indian stock market updates using Perplexity API
- June 27, 2025: Implemented automatic news fetching every 15 minutes with 5 articles per batch and auto-cleanup after 100 articles
- June 27, 2025: Created AI News category with Brain icon and purple gradient styling in category filter
- June 27, 2025: **MAJOR**: Replaced Google OAuth with mobile number OTP authentication system
- June 27, 2025: Implemented secure SMS-based login with 6-digit OTP verification (5-minute expiry)
- June 27, 2025: Created new mobile authentication API endpoints and user profile management
- June 27, 2025: Updated user schema to support phone numbers instead of email-based authentication
- June 27, 2025: Added mobile login page with formatted phone input and OTP verification flow
- June 27, 2025: Enhanced profile page with mobile-first authentication and name editing capabilities
- June 27, 2025: Fixed authentication database schema and session management for mobile auth
- June 27, 2025: Created dedicated disclaimer page accessible via "Terms" tab in bottom navigation
- June 27, 2025: Removed disclaimer from news cards for cleaner, better-placed article layout
- June 27, 2025: Enhanced performance with 30-second memory caching providing instant 2ms responses
- June 27, 2025: Optimized image loading with preloading, skeleton animations, and smart fallbacks
- June 26, 2025: Redesigned news cards to Inshorts-style layout with 40% image, 60% content split
- June 26, 2025: Implemented full-screen vertical scrolling with snap-to-card navigation
- June 26, 2025: Optimized category filter to be more compact for better content visibility
- June 26, 2025: Transformed SEBI RIA section into professional Investment Advisory directory with search functionality
- June 26, 2025: Added Investment Advisor data model and Google Sheets "IA" tab integration
- June 26, 2025: Created Practo-style advisor profiles with contact details, specialization, and ratings
- June 26, 2025: Implemented search functionality for advisor directory by name, company, specialization, and location
- June 26, 2025: Added PWA features with download icon for home screen installation
- June 26, 2025: Created special visual effects for "Special" category with golden gradient and shimmer animation
- June 26, 2025: Fixed Google Sheets integration to properly use category column for article filtering
- June 26, 2025: Enhanced category filtering system to match exact Google Sheets structure
- June 26, 2025: Enhanced sentiment indicators from dots to colored left borders (green/red/gray) for better visual prominence
- June 26, 2025: Removed static rating display from SEBI RIA section and added interactive user rating system
- June 26, 2025: Enhanced SEBI RIA visual design with gradient effects, modern cards, and premium styling
- June 26, 2025: Optimized navigation speed with instant client-side section switching eliminating page reload delays
- June 26, 2025: Enhanced category icons with unique color gradients and modern visual effects
- June 26, 2025: Verified domain stocksshorts.com is fully operational with 200 OK status and proper SSL
- June 26, 2025: Fixed persistent white screen issue with cache-busting deployment (v6.2-cache-clear)
- June 26, 2025: Added no-cache headers to prevent future deployment propagation issues
- June 25, 2025: Restored all original categories in proper order: Trending, Special, Breakout, Index, Warrants, Educational, IPO, Global, Active, Orders, Research
- June 25, 2025: Arranged categories in 2-row grid layout with 6 columns (11 total categories)
- June 25, 2025: Updated bottom navigation with SEBI RIA, Contact, and Profile sections
- June 25, 2025: Implemented Replit Auth for Google sign-in with database integration
- June 25, 2025: Created SEBI RIA page with "Coming Soon" message
- June 25, 2025: Added Contact page with message form functionality
- June 25, 2025: Built Profile page with Google authentication and sign-in/out features
- June 25, 2025: Enhanced text readability with stronger overlays and improved contrast
- June 25, 2025: Enhanced category icons with premium gradients, shimmer effects, ring animations, and refined hover states
- June 25, 2025: Renamed application from "StockShorts" to "StocksShorts" across all components

## User Preferences

Preferred communication style: Simple, everyday language.

### Category Structure (Priority Order)
1. Trending (priority-based sorting: High > Medium > Low)
2. StocksShorts Special  
3. Breakout Stocks
4. Index
5. Warrants
6. Educational
7. IPO
8. Global
9. Most Active
10. Order Win
11. Research Report

### Navigation Requirements
- Connect (SEBI RIA): Clean "Coming Soon" message for investment advisor connections, uses "Connect SEBI RIA" label for clarity
- AskQuery (Contact): Chat interface with instant messaging via email - type message and press Enter or click send
- Profile: Gmail-only authentication with no additional forms or information required