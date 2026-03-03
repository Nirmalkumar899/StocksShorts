# Objective
Fix the app showing the old cached UI. The new Inshorts-style design (tabs header, 3-icon bottom nav) and article rewriting pipeline are already fully coded — they are simply invisible because the Service Worker cache version was never bumped after the changes were made. Bumping the version forces all browsers to discard the old cache and load the new code.

Note: Article rewriting tasks T001-T003 from the original plan are already fully implemented in realNewsIngestor.ts (rewriteArticle function at line 7, called at line 236, with batch processing and graceful fallback).

# Tasks

### T001: Bump Service Worker version to force cache refresh
- **Blocked By**: []
- **Details**:
  - Change `CACHE_VERSION` from `'v1.0.56'` to `'v1.0.57'` in `client/public/sw.js`
  - Change `CACHE_VERSION` from `'v1.0.56'` to `'v1.0.57'` in `dist/public/sw.js`
  - Find and update splash session key in `client/src/pages/home.tsx` (look for `splash_shown_v56`, change to `splash_shown_v57`)
  - Files: `client/public/sw.js`, `dist/public/sw.js`, `client/src/pages/home.tsx`
  - Acceptance: Browser discards old cache, new UI with tabs header and 3-icon bottom nav becomes visible
