# StockShorts - Indian Stock Market News Platform

## Overview

StockShorts is a news aggregation platform that provides concise Indian stock market news in an "Inshorts" style format. The application fetches financial news from Google Sheets and presents it in a mobile-first, user-friendly interface with real-time updates and category-based filtering.

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
- `GET /api/auth/user` - Get authenticated user info
- `GET /api/login` - Start Google OAuth login flow
- `GET /api/logout` - Sign out user
- `POST /api/articles/:id/save` - Save article (requires auth)
- `DELETE /api/articles/:id/save` - Unsave article (requires auth)
- `GET /api/saved-articles` - Get user's saved articles (requires auth)

### UI Components
- **Header**: Brand logo, refresh button, theme toggle
- **CategoryFilter**: 2-row grid layout with 8 categories including Research Reports
- **NewsCard**: Article display with sentiment indicators and save functionality
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

## Changelog

## Recent Changes

- June 25, 2025: Added Research Report category with FileText icon
- June 25, 2025: Redesigned category filter to 2-row grid layout with smaller icons (4 columns)
- June 25, 2025: Updated bottom navigation with SEBI RIA, Contact, and Profile sections
- June 25, 2025: Implemented Replit Auth for Google sign-in with database integration
- June 25, 2025: Created SEBI RIA page with "Coming Soon" message
- June 25, 2025: Added Contact page with message form functionality
- June 25, 2025: Built Profile page with Google authentication and sign-in/out features
- June 25, 2025: Enhanced text readability with stronger overlays and improved contrast

## User Preferences

Preferred communication style: Simple, everyday language.