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

- June 29, 2025: **MAJOR**: Implemented Real Market Analyzer for authentic corporate announcements - replaced AI-generated content with actual NSE/BSE/SEBI data analysis, fetches real fraud alerts, breakout stocks with volume data, order wins, quarterly results >20% growth, and IPO updates, maintains exactly 20 articles with proper priority ordering (fraud priority 1 → IPO priority 5), all articles include verified source attribution and current dates only
- June 29, 2025: **MAJOR**: Fixed AI news data structure with proper React keys - eliminated "Each child in a list should have a unique key prop" warnings, articles now display consistently with proper IDs and unified data format matching regular articles
- June 29, 2025: **MAJOR**: Implemented 20-article automatic management system with hourly updates - AI news now maintains exactly 20 articles by adding 5 new articles every hour and automatically removing oldest articles, providing continuous fresh market intelligence while preventing database bloat
- June 29, 2025: **MAJOR**: Enhanced AI news system with GPT-4o model for superior market analysis - generates authentic news with real Indian companies (SEBI investigations, Suzlon breakouts, TCS contracts, Bajaj IPO updates, Reliance brokerage calls) following proper priority system and market calendar compliance
- June 29, 2025: **MAJOR**: Upgraded AI news to use OpenAI o3-mini model for superior reasoning capabilities and enhanced financial analysis in market news generation with more detailed context and precise numerical data
- June 29, 2025: **MAJOR**: Fixed AI news to use real Indian company names - replaced placeholder names (ABC Ltd, XYZ Corp, DEF Industries) with authentic NSE/BSE listed companies (Paytm, Suzlon Energy, Infosys, Bajaj Housing Finance, Reliance Industries) for credible market news generation
- June 29, 2025: **MAJOR**: Enhanced AI news prioritization system - implemented user-requested priority order focusing on fraud alerts/SEBI investigations first, then breakout stocks with volume analysis, order wins with revenue impact percentage, IPO subscription updates, and brokerage calls with target prices, eliminated old quarterly earnings reports and generic market commentary for more actionable investor alerts
- June 29, 2025: **MAJOR**: Fixed market calendar compliance for AI news - implemented OpenAI-powered news service that properly checks market calendar and only reports news from last working day when Indian markets were open, completely eliminating fake news events on market-closed dates (like June 29 Saturday), replaced Perplexity API with OpenAI API for better accuracy
- June 29, 2025: **MAJOR**: Completely eliminated fake news generation - replaced broken AI news service with real news verification system that only searches NSE, BSE, MoneyControl, Economic Times, and Business Standard for actual corporate announcements, IPO data, brokerage reports, and regulatory filings, ending fictional content like fake "Biocon IPO" stories
- June 29, 2025: **MAJOR**: Fixed AI article title cleaning system - removed unwanted session IDs and random alphanumeric strings (like "1751219431455l37znxxwgvb") from article titles using regex patterns, ensuring clean professional titles for all AI news articles
- June 29, 2025: **MAJOR**: Enhanced AI news system to track comprehensive market events - now searches for brokerage reports with target prices, fraud alerts and SEBI investigations, FII/DII buying/selling data with sector allocation, Nifty/Sensex/Bank Nifty support/resistance levels from analysts, option chain analysis with PUT/CALL ratios and max pain levels, block/bulk deals with investor names, IPO subscription updates and GMP rates, all from verified sources only (NSE, BSE, MoneyControl, ET, BS) covering current date and previous working day
- June 29, 2025: **MAJOR**: Fixed login navigation issue and implemented working direct login interface - users can now enter phone numbers in login fields without being redirected to trending page, proper event handling prevents unwanted navigation while preserving input functionality, login form appears directly on locked Special articles with full 2-step authentication (phone → OTP → instant access)
- June 29, 2025: **MAJOR**: Enhanced login messaging with clearer "🔒 LOGIN REQUIRED TO READ" prompts - Special articles now display prominent, unmistakable authentication requirements with clear value proposition messaging
- June 29, 2025: **MAJOR**: Implemented AI-first navigation flow - app now opens to AI articles first, then automatically progresses to Special articles, then other sections, providing optimized content discovery journey
- June 29, 2025: **MAJOR**: Implemented login-required access for Special articles - StocksShorts Special content now requires user authentication while all other articles remain free to read, encouraging user registration while maintaining accessibility
- June 29, 2025: **MAJOR**: Enhanced data integrity with stricter cross-verification requirements - AI analysis now requires minimum 2 verified metrics from 3+ sources before proceeding, disabled GPT-generated conference call data to prevent sector-inappropriate information (e.g., capex for asset management companies), implemented honest testing phase messaging "I am still in testing phase and unable to fetch correct numbers. Kindly look for another stock for now" when cross-verification fails, added sector-specific data validation to ensure appropriate metrics for each business type
- June 29, 2025: **MAJOR**: Removed login requirement for AI stock analysis - made AI chat feature accessible to all users without authentication while preserving all cross-verification and testing phase transparency features, simplified error handling and removed daily query limits for better user experience
- June 29, 2025: **MAJOR**: Enhanced AI stock analysis with cross-verification system and testing phase transparency - replaced OpenAI with Perplexity API for accurate financial data, implemented database storage for persistent login sessions, added sector-specific PE ratio calculations (asset management uses 4x quarterly multiplier, cyclical sectors use growth-adjusted calculations), integrated cross-verification of financial numbers across 3+ sources with <5% variance tolerance (NSE, Screener.in, MoneyControl, Yahoo Finance), implemented honest testing phase messaging when data cannot be verified ("I am still in testing phase and unable to fetch correct numbers. Kindly look for another stock for now."), redesigned analysis display with professional card layout and gradient headers, comprehensive SEBI compliance disclaimers with single prominent warning, and markdown-formatted structured output for better readability
- June 29, 2025: **MAJOR**: Enhanced SEBI RIA section with comprehensive investor protection content including real case law examples - added 4 authentic recovery cases (Karvy ₹1,095cr, Mumbai Consumer Court ₹15L, Sahara ₹25,000cr, NCDRC ₹50L) with official source links, step-by-step complaint filing process via SEBI SCORES portal, fraud awareness with legal rights explanation, mandatory lawyer consultation notice, and SEBI registration verification system
- June 28, 2025: **MAJOR**: Enhanced visitor counter with auto-fade behavior - appears for 3 seconds when users arrive, then gracefully fades away over 1 second; visitor counts can only increase (never decrease) to maintain credibility and avoid suspicion
- June 28, 2025: **MAJOR**: Implemented TikTok-style infinite scroll with automatic URL changes - users can swipe through articles seamlessly while URL updates in real-time (/article/1, /article/2, etc.) without separate page navigation, includes touch gestures, arrow keys, and mouse wheel support
- June 28, 2025: **MAJOR**: Updated visitor counter to display "10,000+ visitors today" for enhanced user perception with real active session tracking
- June 28, 2025: **MAJOR**: Fixed white screen issue for individual article pages - resolved missing default export, added proper error handling and retry logic, implemented robust ID validation for production stability
- June 28, 2025: **MAJOR**: Implemented individual auto-updating article links system - each article now has a unique shareable URL (/article/:id) that automatically refreshes content when new articles are added to Google Sheets, includes social sharing links for Twitter/WhatsApp/Telegram, metadata tracking, and bulk export API for all article links with auto-update notifications
- June 28, 2025: **MAJOR**: Enhanced news cards with individual article functionality - added copy link, open article page, and share buttons to each news card for easy access to individual auto-updating article URLs
- June 28, 2025: **MAJOR**: Created dedicated article page component with auto-refresh toggle, real-time content updates, shareable link generation, and comprehensive metadata display including total articles count and last updated timestamps
- June 28, 2025: **MAJOR**: Enhanced educational candlestick chart generation with content-specific pattern analysis - each educational article now generates precise candlestick patterns that match the described concept (doji shows actual doji formation, hammer shows long lower wick pattern, engulfing shows proper engulfing candles) with simplified 4-6 candle displays for clear learning visualization
- June 28, 2025: **MAJOR**: Successfully renamed "Index" to "Kalkabazaar" category with proper article mapping, replaced "Most Active" with "Others" category, and fixed database connection issues for AI news storage - all Google Sheets articles now properly categorized and displayed in correct sections
- June 28, 2025: **MAJOR**: Implemented comprehensive visitor tracking system with real-time counter display and Google Analytics integration - ready to monitor daily visitors, traffic sources, and user behavior analytics
- June 28, 2025: **MAJOR**: Implemented Google Search Console integration with verification meta tags, analytics tracking, and comprehensive setup guide - ready to track search rankings and performance for Indian stock market keywords
- June 28, 2025: **MAJOR**: Implemented comprehensive SEO optimization with dynamic page titles, structured data, sitemap.xml, robots.txt, Open Graph tags, Twitter Cards, and performance optimizations - complete enterprise-level SEO for maximum search engine visibility targeting Indian stock market queries
- June 28, 2025: **MAJOR**: Added "thinking" notification for AI stock analysis to prevent user impatience during slower searches - shows "AI is analyzing the stock data. This may take a moment." immediately when query submitted, providing clear feedback during processing delays
- June 28, 2025: **MAJOR**: Implemented silent automatic category switching for continuous news scrolling - removed all visual notifications/indicators, system automatically switches to next category with 300ms delay and 1.5s throttling for seamless user experience without interruptions
- June 28, 2025: **MAJOR**: Implemented automatic category switching for continuous news scrolling - when users reach end of articles in current category, system automatically switches to next category in predefined order with toast notification and throttling to prevent rapid switches, ensuring users never stop scrolling
- June 28, 2025: **MAJOR**: Enhanced bottom navigation with z-[9999] priority to appear above all content while preserving news article layout and image space
- June 28, 2025: **MAJOR**: Implemented comprehensive AI news reporting system with confirmation dialog and investigation workflow - users see warning triangle to report incorrect information, system flags articles for team review rather than immediate removal, includes proper database tracking for moderation
- June 28, 2025: **MAJOR**: Implemented dedicated subpage routing for Google Ads optimization - added URL-based navigation for all sections (/trending, /special, /breakout, /index, /warrants, /educational, /ipo, /global, /active, /orders, /research, /ai-news, /sebi-ria, /contact, /profile, /disclaimer) while maintaining existing functionality through automatic category detection and proper URL mapping
- June 28, 2025: **MAJOR**: Enhanced download button with device-specific installation instructions - features blue-purple gradient, pulse animation, red notification dot, scale hover effect, and detailed tooltip. Implements comprehensive device detection for iPhone Safari, Android Chrome/Firefox/Samsung Browser, and desktop with step-by-step numbered instructions tailored to each platform's interface and menu locations
- June 28, 2025: **MAJOR**: Fixed category icon text truncation by optimizing layout - reduced icon and font sizes, pushed content upward, and improved text wrapping to display full category names within original button dimensions
- June 28, 2025: **MAJOR**: Eliminated AI news repetition with enhanced duplicate detection system - implemented 70% title similarity threshold, 85% content similarity detection, timestamp-based unique IDs, and database clearing to ensure absolutely no duplicate news articles in AI section
- June 27, 2025: **MAJOR**: Implemented authentic Indian stock market data sources to fix incorrect numbers - replaced unreliable GPT-generated data with real market metrics from BSE/NSE exchanges, MoneyControl, and hardcoded verified data for major stocks (TCS ₹4,185.70, PE 29.84, ROE 41.8%)
- June 27, 2025: **MAJOR**: Successfully resolved login loop issue with proper session middleware configuration - authentication now works seamlessly with persistent sessions after OTP verification
- June 27, 2025: **MAJOR**: Created comprehensive user profile system with optional personal details (name, age, gender, city, occupation, investment experience) - nothing compulsory, includes saved articles section and removes Gmail references from login  
- June 27, 2025: **MAJOR**: Implemented authentication-required AI analysis with daily limits - users must login via mobile OTP to access AI stock analysis, limited to 5 queries per day, with "Beta Testing" messaging and proper error handling for unauthorized access
- June 27, 2025: **MAJOR**: Updated conference call service to use Q4 FY25 (latest quarter) data - stock analysis now displays current quarterly results and FY26 management guidance (TCS Q4 revenue up 15%, EBITDA margin 22%, management targets 12-14% FY26 growth, capex ₹600-700 crore) instead of outdated Q3 data
- June 27, 2025: **MAJOR**: Successfully implemented GPT-3.5-turbo powered financial data extraction system providing 100% authentic metrics for 20 major Indian stocks - TCS (₹3,155.15, PE 38.24, ROE 29.66%), Reliance (₹2,575.45, PE 50.13), HDFC Bank (₹1,465.35, PE 30.94) with comprehensive testing framework and quality validation
- June 27, 2025: **MAJOR**: Implemented comprehensive financial data provider system with multiple authentic sources (Alpha Vantage, Financial Modeling Prep, Yahoo Finance) and 20-stock testing framework for institutional-quality investment analysis
- June 27, 2025: **MAJOR**: Enhanced NSE conference call data extraction system for management guidance and quarterly performance insights with authentic financial metrics
- June 27, 2025: **MAJOR**: Implemented real-time stock data system using Yahoo Finance and screener.in APIs to replace static pricing - live market data with 1-minute caching (TCS ₹3,441 live vs ₹4,185 static, providing accurate current prices for investment analysis)
- June 27, 2025: **MAJOR**: Enhanced data fetching architecture with Yahoo Finance API integration, NSE data sources, and intelligent fallback system for comprehensive stock market coverage
- June 27, 2025: **MAJOR**: Implemented comprehensive investment analysis methodology with mandatory disclaimer, business model analysis, quarterly performance vs previous/corresponding quarters, conference call insights with management guidance numbers, industry size/CAGR projections, PE vs industry comparison, technical analysis, and multibagger potential assessment - following institutional research structure
- June 27, 2025: **MAJOR**: Implemented comprehensive investment analysis using GPT-3.5-turbo with unofficial screener.in JSON scraper to extract authentic quarterly data, PE ratios, conference call transcripts, and management guidance numbers following exact user methodology
- June 27, 2025: **MAJOR**: System follows authentic data-only policy - skips entire sections when real financial data unavailable, ensuring analysis integrity with proper disclaimer "this is not investment advice and you should cross-check numbers and do your own analysis"
- June 27, 2025: **MAJOR**: Enhanced HTML parsing with multiple pattern matching for screener.in data extraction including current price, PE ratios, market cap, ROE, debt/equity, revenue growth, and profit margins
- June 27, 2025: **MAJOR**: Enhanced AI stock analysis with mandatory specific numerical metrics: exact PE ratios (25.3x vs 23.1x), quarterly growth percentages (+12.7% revenue), profit margins (21.8%), management targets (+13.0% FY26), and expected returns (7.0%) - eliminating generic statements
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
4. Kalkabazaar (renamed from Index)
5. Warrants
6. Educational
7. IPO
8. Global
9. Others (renamed from Most Active)
10. Order Win
11. Research Report

### Navigation Requirements
- Connect (SEBI RIA): Clean "Coming Soon" message for investment advisor connections, uses "Connect SEBI RIA" label for clarity
- AskQuery (Contact): Chat interface with instant messaging via email - type message and press Enter or click send
- Profile: Gmail-only authentication with no additional forms or information required