# StocksShorts - Indian Stock Market News Platform

## Overview
StocksShorts is a news aggregation platform delivering concise, "Inshorts"-style Indian stock market news. It fetches financial news from Google Sheets, providing a mobile-first, user-friendly interface with real-time updates and category-based filtering. The platform aims to be a primary source for quick, authenticated market intelligence, integrating AI for stock analysis and connecting users with SEBI Registered Investment Advisors. Its ambition is to become the leading platform for Indian stock market news and analysis, recognized for its accuracy, conciseness, and user-centric design.

## User Preferences
Preferred communication style: Simple, everyday language.

### Category Structure (Priority Order)
1. Trending (priority-based sorting: High > Medium > Low)
2. StocksShorts Special
3. IPO
4. Breakout Stocks
5. Kalkabazaar (renamed from Index)
6. Warrants
7. Trader View (replacing Global, linked to "Trader View" articles in Google Sheets)
8. Order Win
9. Research Report
10. Educational
11. US Market (now includes Global articles from Google Sheets)
12. Crypto

### Navigation Requirements
- Connect (SEBI RIA): Clean "Coming Soon" message for investment advisor connections, uses "Connect SEBI RIA" label for clarity
- AskQuery (Contact): Chat interface with instant messaging via email - type message and press Enter or click send
- Profile: Gmail-only authentication with no additional forms or information required

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI Framework**: Tailwind CSS with shadcn/ui
- **Build Tool**: Vite
- **Styling**: Custom CSS variables, dark mode support

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API
- **Session Storage**: In-memory for user management
- **External Integration**: Google Sheets API for content management

### Data Storage
- **Primary Data Source**: Google Sheets (CMS)
- **Database**: PostgreSQL with Drizzle ORM (configured)
- **Caching**: Client-side via React Query

### Core Features
- **News Aggregation**: Real-time article fetching from Google Sheets.
- **Category Filtering**: Nifty, Sensex, IPOs, Mutual Funds, Crypto, etc.
- **Sentiment & Priority**: Articles classified by sentiment (Positive, Negative, Neutral) and priority (High, Medium, Low).
- **Mobile-First Design**: Responsive layout with bottom navigation.
- **Dark Mode**: Theme toggle.
- **AI Stock Analysis**: OpenAI-powered, fundamentals-first approach, document-only analysis from Google Drive, cross-verified data.
- **Hindi Translation**: OpenAI-powered translation for article content.
- **OTP Authentication**: Mobile number-based login.
- **SEBI RIA Directory**: Platform for connecting with SEBI Registered Investment Advisors.
- **SEO Optimization**: Dynamic titles, structured data, sitemap, Open Graph.

### UI/UX Decisions
- Clean, professional design with consistent styling.
- Responsive components with shadcn/ui and Radix UI.
- Intuitive navigation with a sticky header and bottom navigation bar.
- TikTok-style infinite scroll with seamless category switching.
- Splash screen with branding and loading animations.

### Technical Implementations
- **Asset Hosting**: Replit asset hosting with automatic URL conversion.
- **Image Optimization**: `object-contain` for full image display, fallback systems.
- **Deployment**: Vite for client, esbuild for server, deployed on Replit.
- **Authentic Data**: Integration with Yahoo Finance, Screener.in, NSE, BSE APIs for verified market data.

## External Dependencies
- **Google Sheets API**: For news content management.
- **Google Drive API**: For AI document analysis.
- **OpenAI API**: For AI stock analysis and Hindi translation (GPT-4o, GPT-3.5-turbo).
- **MSG91/Fast2SMS**: For mobile OTP authentication.
- **PostgreSQL**: Database for Drizzle ORM.
- **Yahoo Finance API**: For real-time stock data.
- **Screener.in (unofficial scraper)**: For financial data extraction.
- **Google Analytics 4**: For user tracking and analytics.
- **Google Search Console**: For SEO monitoring.