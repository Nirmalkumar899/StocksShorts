# StocksShorts - Indian Stock Market News Platform

## Overview
StocksShorts is a news aggregation platform designed for the Indian stock market, providing concise news updates in an "Inshorts" style format. It aims to offer a mobile-first, user-friendly interface with real-time updates and category-based filtering, leveraging Google Sheets as its content management system. The platform focuses on delivering high-quality, verified financial news and analysis to its users, with ambitions to become a primary source for Indian stock market insights.

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

## Recent Changes (August 30, 2025)
- **MAJOR UPDATE**: Completely replaced Google Sheets with AI-powered news generation using OpenAI GPT-4o
- **Interface**: Removed all top header icons and category filters for ultra-clean Inshorts-style design 
- **Caching**: Implemented automatic refresh system that generates 50+ fresh articles every 10 minutes
- **Sources**: Added clickable source attribution links at bottom of each news card
- **Categories**: System now auto-generates comprehensive coverage including brokerage reports, global impact, sectoral analysis

## System Architecture
StocksShorts is built with a mobile-first approach, emphasizing performance and user experience.

### Frontend
- **Framework**: React 18 with TypeScript.
- **Routing**: Wouter.
- **State Management**: TanStack Query (React Query).
- **UI Framework**: Tailwind CSS with shadcn/ui and Radix UI.
- **Build Tool**: Vite.
- **Styling**: Custom CSS variables for theming with dark mode support.
- **Design Principles**: Responsive layout, bottom navigation, clean and professional appearance with subtle animations and gradients where appropriate. UI components include Header, CategoryFilter (horizontal scrollable row), NewsCard, BottomNavigation, SebiRia, Contact, and Profile sections.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **API Style**: RESTful API.
- **Session Storage**: In-memory.
- **Content Management**: Google Sheets API.
- **AI Integration**: OpenAI (GPT-4o) for Hindi translation and stock analysis, and Perplexity API for financial data verification.
- **Authentication**: Mobile number OTP verification via SMS (MSG91/Fast2SMS).

### Data Flow & Features
- **Content Management**: Articles are managed in Google Sheets with detailed metadata (Title, Content, Type, Time, Source, Sentiment, Priority).
- **News Aggregation**: Fetches articles from Google Sheets with real-time refresh.
- **Category Filtering**: Supports various categories including Nifty, Sensex, IPOs, Mutual Funds, and Crypto, with priority-based sorting.
- **Sentiment & Priority**: Articles are tagged with sentiment (Positive, Negative, Neutral) and priority (High, Medium, Low).
- **AI Stock Analysis**: Provides detailed investment analysis using official company documents (PDFs from Google Drive), quarterly results, conference call transcripts, and investor presentations. Features cross-verification of financial data from multiple authentic sources (NSE, BSE, Screener.in, MoneyControl, Yahoo Finance) and provides transparent "testing phase" messages if data cannot be verified. Analysis includes business model, PE vs industry, quarterly performance, management commentary, and technical analysis.
- **Hindi Translation**: OpenAI-powered translation of articles with batch processing and robust error handling.
- **Mobile Authentication**: OTP-based login/registration with profile management.
- **Infinite Scroll**: TikTok-style infinite vertical scroll with automatic URL updates and bidirectional category switching for a seamless browsing experience.
- **Image Handling**: Optimized image display with `object-contain`, intelligent company-specific image matching, and fallbacks.
- **SEO & Analytics**: Google Search Console integration, dynamic page titles, structured data, sitemap.xml, robots.txt, Open Graph tags, Twitter Cards, and Google Analytics 4 tracking.
- **Individual Article Pages**: Unique shareable URLs for each article with auto-refresh functionality.
- **SEBI RIA Section**: Educational content on SEBI RIAs, investor rights, complaint filing process, fraud awareness, and a directory of advisors.

## External Dependencies
- **Google Sheets API**: For primary content management (CMS).
  - `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEETS_ID`
- **Google Drive API**: For accessing company research documents (PDFs) for AI analysis.
- **OpenAI API**: For Hindi translation and advanced AI stock analysis (GPT-4o).
- **Perplexity API**: Used for authentic market data and financial data verification.
- **PostgreSQL**: Configured with Drizzle ORM (present in setup but not actively used for core news articles).
  - `DATABASE_URL`
- **MSG91 / Fast2SMS**: For mobile OTP authentication via SMS.
- **Yahoo Finance API**: For real-time stock data.
- **Screener.in**: For scraping authentic quarterly data and financial metrics.
- **Alpha Vantage / Financial Modeling Prep**: Additional financial data sources for cross-verification.
- **shadcn/ui**: UI component library.
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first styling.
- **Lucide React**: Icon library.
- **Google Analytics 4**: For comprehensive user tracking and analytics.