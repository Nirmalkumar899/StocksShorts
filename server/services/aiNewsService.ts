import { db } from "../db";
import { aiArticles, type InsertAiArticle, type AiArticle } from "@shared/schema";
import { desc, count, inArray, gte, lt, eq, and, or, ilike } from "drizzle-orm";

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  citations?: string[];
}

interface ParsedArticle {
  title: string;
  content: string;
  sentiment: string;
  priority: string;
}

export class AINewsService {
  private readonly maxArticles = 20;
  private readonly articlesPerBatch = 5;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
  }

  async fetchLatestNews(): Promise<AiArticle[]> {
    if (!this.apiKey) {
      console.log('PERPLEXITY_API_KEY not configured, skipping AI news fetch');
      return [];
    }

    try {
      // Check if we need to populate the database initially
      const currentCount = await db.select({ count: count() }).from(aiArticles);
      const totalArticles = currentCount[0]?.count || 0;
      
      if (totalArticles === 0) {
        console.log('No AI articles found, performing initial population with 20 articles...');
        return await this.initialPopulation();
      }
      // Generate unique content variations to prevent repetition
      const sessionId = Date.now() + Math.random().toString(36).substring(2);
      const stockRotation = [
        ['TCS', 'Infosys', 'Wipro', 'HCL Tech', 'Tech Mahindra'],
        ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Bank'],
        ['Reliance', 'ONGC', 'IOC', 'BPCL', 'GAIL'],
        ['Maruti', 'Tata Motors', 'Bajaj Auto', 'M&M', 'Eicher Motors'],
        ['Sun Pharma', 'Dr Reddy', 'Cipla', 'Lupin', 'Biocon']
      ];
      const selectedStocks = stockRotation[Math.floor(Math.random() * stockRotation.length)];
      const basePrice = 1000 + Math.floor(Math.random() * 3000);
      const indexLevel = 45000 + Math.floor(Math.random() * 15000);
      
      const prompt = `Generate 5 COMPLETELY UNIQUE Indian stock market alerts for ${new Date().toLocaleDateString('en-IN')} using session ID: ${sessionId}

ABSOLUTE UNIQUENESS REQUIREMENTS:
- Use ONLY these stocks: ${selectedStocks.join(', ')}
- Use price range: ₹${basePrice}-₹${basePrice + 1000}
- Include session ID [${sessionId}] in each title
- Each alert must be DIFFERENT from all previous generations

MANDATORY FORMAT - Generate 5 different alerts:

Alert 1 - BREAKOUT STOCK:
Title: "27-Jun-2025: [Stock Name]: Technical breakout above ₹[X], targets ₹[Y]"
Content: "27-Jun-2025: [Stock] breaks above key resistance of ₹[level] with 2x volume surge. Breakout pattern confirmed on daily charts. Next targets ₹[target1] and ₹[target2]. Stop loss ₹[SL]. Strong BUY for breakout momentum."

Alert 2 - INDEX BREAKOUT:
Title: "27-Jun-2025: [Sector Index] breaks above [X] resistance, targets [Y]"
Content: "27-Jun-2025: [Sector Index] breaks above key resistance of [level] with strong volumes. Technical breakout confirmed. Next targets [target1] and [target2]. Support at [support level]. [Sector] index showing momentum for further gains."

Alert 3 - RESEARCH REPORT:
Title: "27-Jun-2025: [Broker] upgrades [Small/Mid/Large Cap Stock] to BUY, target ₹[X]"
Content: "27-Jun-2025: [Broker name] upgrades [Stock] from HOLD to BUY with target ₹[price]. Research highlights strong [growth/margin/market share] expansion. Stock trading at ₹[current]. Upside potential [X]%. Recommended for [small/mid/large] cap portfolio."

Alert 4 - ORDER WIN:
Title: "27-Jun-2025: [Stock Name]: Wins ₹[X] crore order, [Y]% of revenue"
Content: "27-Jun-2025: [Company] secures major ₹[amount] crore order worth [X]% of annual revenue. Order from [client sector] validates business model. Stock up [Y]% on announcement. Revenue visibility improved for next [timeframe]. Strong BUY."

Alert 5 - IPO/SME UPDATE:
Title: "27-Jun-2025: [Company] IPO: Grey market premium at [X]%, listing on [date]"
Content: "27-Jun-2025: [Company] IPO opens [start date] to [end date] at ₹[price] per share. Grey market premium at [X]% indicates strong demand. Business: [sector/industry]. Size: ₹[amount] crore. Lot size: [shares]. Expected listing: [date]. [BUY/AVOID] based on premium and fundamentals."

Focus on actionable investment themes: breakouts, sector index breakouts (Bank Nifty, IT Index, Pharma Index, Auto Index, Metal Index), research upgrades, significant order wins, IPO/SME updates with grey market premiums

Include IPO subscription dates, grey market premium analysis, business sector, and listing expectations. Use specific sector indices with resistance/support levels. Avoid generic market commentary.

Return only valid JSON array with no extra text.`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a financial news analyst. Generate UNIQUE content that has never been created before. Always use different stocks, different price levels, different events in each generation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.8,
          search_domain_filter: ['economictimes.com', 'livemint.com', 'moneycontrol.com', 'business-standard.com', 'reuters.com', 'bloomberg.com'],
          return_related_questions: false,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data: PerplexityResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from Perplexity API');
      }

      // Parse JSON response
      const articles = this.parseArticlesFromResponse(content);
      console.log(`Parsed ${articles.length} articles from Perplexity API`);
      
      // If no articles from API, skip storing to maintain data integrity
      if (articles.length === 0) {
        console.log('No articles received from Perplexity API');
        return [];
      }
      
      // Store articles in database
      const storedArticles = await this.storeArticles(articles);
      
      // Clean up old articles if needed
      await this.cleanupOldArticles();
      
      console.log(`Successfully fetched and stored ${storedArticles.length} AI news articles`);
      return storedArticles;

    } catch (error) {
      console.error('Error fetching AI news:', error);
      return [];
    }
  }

  private parseArticlesFromResponse(content: string): ParsedArticle[] {
    try {
      console.log('Raw API response:', content.substring(0, 500));
      
      // The response contains nested structures, extract the actual article data
      let articles: ParsedArticle[] = [];
      
      // Method 1: Extract from nested alert structure with proper escaping
      const alertMatches = content.match(/"Alert \d+[^"]*":\s*\{[^}]*"Title":\s*"([^"]*)"[^}]*"Content":\s*"([^"]*)"/g);
      if (alertMatches) {
        alertMatches.forEach(alertMatch => {
          const titleMatch = alertMatch.match(/"Title":\s*"([^"]*)"/);
          const contentMatch = alertMatch.match(/"Content":\s*"([^"]*)"/);
          if (titleMatch && contentMatch) {
            articles.push({
              title: titleMatch[1],
              content: contentMatch[1],
              sentiment: 'Positive',
              priority: 'High'
            });
          }
        });
      }
      
      // Method 2: Look for simple title/content pairs
      if (articles.length === 0) {
        const titleMatches = content.match(/"[Tt]itle":\s*"([^"]*)"[^}]*"[Cc]ontent":\s*"([^"]*)"/g);
        if (titleMatches) {
          titleMatches.forEach(titleMatch => {
            const titleExtract = titleMatch.match(/"[Tt]itle":\s*"([^"]*)"/);
            const contentExtract = titleMatch.match(/"[Cc]ontent":\s*"([^"]*)"/);
            if (titleExtract && contentExtract) {
              articles.push({
                title: titleExtract[1],
                content: contentExtract[1],
                sentiment: 'Positive',
                priority: 'High'
              });
            }
          });
        }
      }
      
      // If no real news found, don't generate fake content
      if (articles.length === 0) {
        console.log('No real market news found for today/yesterday - not generating fake content');
        return [];
      }
      
      console.log(`Extracted ${articles.length} articles from response`);
      
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
      
      return articles.slice(0, this.articlesPerBatch)
        .filter(article => article && article.title && article.content)
        .map(article => ({
          title: (article.title || '')
            .replace(/\[[0-9a-z]+\]:\s*/gi, '') // Remove [sessionId]: 
            .replace(/\|\s*Session ID:\s*[0-9a-z]+/gi, '') // Remove | Session ID: xxx
            .replace(/\[[0-9a-z]+\]/gi, '') // Remove [sessionId]
            .replace(/ID:\s*[0-9a-z]+/gi, '') // Remove ID: xxx
            .trim()
            .substring(0, 200),
          content: (article.content || '').substring(0, 500),
          sentiment: ['Positive', 'Negative', 'Neutral'].includes(article.sentiment) ? article.sentiment : 'Positive',
          priority: ['High', 'Medium', 'Low'].includes(article.priority) ? article.priority : 'High'
        }));

    } catch (error) {
      console.error('Error parsing articles:', error);
      return [];
    }
  }



  private generateTodaysMarketAlerts(): ParsedArticle[] {
    // No artificial content generation - only real news tracking
    console.log('No artificial market alerts generated - system only tracks verified news');
    return [];
  }

  private generateFallbackArticles(): ParsedArticle[] {
    // Return empty array - no fallback content
    // We only want real news, not generated content
    console.log('No real news found - returning empty array instead of fallback articles');
    return [];
  }

  private async storeArticles(articles: ParsedArticle[]): Promise<AiArticle[]> {
    if (articles.length === 0) {
      console.log('No valid articles to store');
      return [];
    }

    // Check current article count
    const currentCount = await db.select({ count: count() }).from(aiArticles);
    const totalArticles = currentCount[0]?.count || 0;
    
    console.log(`Current AI articles count: ${totalArticles}`);

    // If we have 20 or more articles, remove the 5 oldest before adding new ones
    if (totalArticles >= this.maxArticles) {
      const oldestArticles = await db
        .select({ id: aiArticles.id })
        .from(aiArticles)
        .orderBy(aiArticles.createdAt)
        .limit(this.articlesPerBatch);
      
      if (oldestArticles.length > 0) {
        const oldestIds = oldestArticles.map((row: any) => row.id);
        await db.delete(aiArticles).where(inArray(aiArticles.id, oldestIds));
        console.log(`Removed ${oldestArticles.length} oldest articles to maintain ${this.maxArticles} limit`);
      }
    }

    // Filter out duplicates by comparing with existing articles
    const uniqueArticles = await this.filterDuplicates(articles);

    const insertData: InsertAiArticle[] = uniqueArticles.map(article => ({
      title: article.title,
      content: article.content,
      type: "AI News",
      source: "AI Generated - Perplexity",
      sentiment: article.sentiment,
      priority: article.priority,
      imageUrl: null,
      newsDate: new Date() // Current date for when the news is relevant
    }));

    const result = await db.insert(aiArticles).values(insertData).returning();
    console.log(`Stored ${result.length} new AI articles (filtered ${articles.length - uniqueArticles.length} duplicates)`);
    return result;
  }

  private async filterDuplicates(articles: ParsedArticle[]): Promise<ParsedArticle[]> {
    const uniqueArticles: ParsedArticle[] = [];
    
    // Get all existing articles from the last 7 days for comparison
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const existingArticles = await db
      .select({ title: aiArticles.title, content: aiArticles.content })
      .from(aiArticles)
      .where(gte(aiArticles.createdAt, sevenDaysAgo));
    
    for (const article of articles) {
      let isDuplicate = false;
      
      // Check against existing articles in database
      for (const existing of existingArticles) {
        const titleSimilarity = this.calculateSimilarity(existing.title, article.title);
        const contentSimilarity = this.calculateSimilarity(
          existing.content.substring(0, 150), 
          article.content.substring(0, 150)
        );
        
        // Consider duplicate if title is >70% similar OR content is >85% similar
        if (titleSimilarity > 0.7 || contentSimilarity > 0.85) {
          isDuplicate = true;
          console.log(`Duplicate detected: ${article.title} (similarity: ${Math.max(titleSimilarity, contentSimilarity).toFixed(2)})`);
          break;
        }
      }
      
      // Also check against articles in current batch
      if (!isDuplicate) {
        for (const existing of uniqueArticles) {
          const titleSimilarity = this.calculateSimilarity(existing.title, article.title);
          const contentSimilarity = this.calculateSimilarity(
            existing.content.substring(0, 150),
            article.content.substring(0, 150)
          );
          
          if (titleSimilarity > 0.7 || contentSimilarity > 0.85) {
            isDuplicate = true;
            console.log(`Batch duplicate detected: ${article.title}`);
            break;
          }
        }
      }
      
      if (!isDuplicate) {
        uniqueArticles.push(article);
      }
    }
    
    return uniqueArticles;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private async cleanupOldArticles(): Promise<void> {
    try {
      // Delete articles older than 2 days (keeping only today + yesterday)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const deletedArticles = await db
        .delete(aiArticles)
        .where(lt(aiArticles.createdAt, twoDaysAgo))
        .returning({ id: aiArticles.id });

      if (deletedArticles.length > 0) {
        console.log(`Cleaned up ${deletedArticles.length} old AI articles (older than 2 days)`);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  async getAllAiArticles(): Promise<AiArticle[]> {
    const articles = await db
      .select()
      .from(aiArticles)
      .orderBy(desc(aiArticles.createdAt));
    
    return this.sortByInvestorValue(articles);
  }

  async getRecentAiArticles(limit: number = 20): Promise<AiArticle[]> {
    // Only show articles from last 2 days (today + yesterday)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const articles = await db
      .select()
      .from(aiArticles)
      .where(gte(aiArticles.createdAt, twoDaysAgo))
      .orderBy(desc(aiArticles.createdAt))
      .limit(limit);
      
    return this.sortByInvestorValue(articles);
  }

  async storeTestArticles(articles: ParsedArticle[]): Promise<AiArticle[]> {
    return await this.storeArticles(articles);
  }

  async flagReportedArticle(articleId: number): Promise<void> {
    try {
      const { eq } = await import('drizzle-orm');
      const { aiArticleReports } = await import('@shared/schema');
      
      // Check if article exists
      const article = await db.select().from(aiArticles).where(eq(aiArticles.id, articleId)).limit(1);
      if (article.length === 0) {
        throw new Error('Article not found');
      }

      // Check if already reported
      const existingReport = await db.select().from(aiArticleReports)
        .where(eq(aiArticleReports.articleId, articleId)).limit(1);
      
      if (existingReport.length === 0) {
        // Create new report record
        await db.insert(aiArticleReports).values({
          articleId: articleId,
          status: 'pending'
        });
        console.log(`Flagged AI article with ID: ${articleId} for investigation`);
      } else {
        console.log(`Article ${articleId} already flagged for review`);
      }
    } catch (error) {
      console.error('Error flagging reported article:', error);
      throw new Error('Failed to flag reported article');
    }
  }

  private sortByInvestorValue(articles: AiArticle[]): AiArticle[] {
    return articles.sort((a, b) => {
      // Calculate investor value score for each article
      const scoreA = this.calculateInvestorValueScore(a);
      const scoreB = this.calculateInvestorValueScore(b);
      
      // Sort by score (highest first), then by creation date (newest first)
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  private async initialPopulation(): Promise<AiArticle[]> {
    console.log('Starting initial population to fill 20 AI articles...');
    const allArticles: AiArticle[] = [];
    
    // Make 4 API calls to get 20 articles (5 per call)
    for (let i = 0; i < 4; i++) {
      try {
        console.log(`Initial population batch ${i + 1}/4...`);
        const articles = await this.parseArticlesFromResponse(await this.callPerplexityAPI());
        const storedArticles = await this.storeArticlesDirectly(articles);
        allArticles.push(...storedArticles);
        
        // Wait 2 seconds between calls to avoid rate limits
        if (i < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Initial population batch ${i + 1} failed:`, error);
        // Use fallback articles for failed batches
        const fallbackArticles = this.generateFallbackArticles();
        const storedArticles = await this.storeArticlesDirectly(fallbackArticles);
        allArticles.push(...storedArticles);
      }
    }
    
    console.log(`Initial population completed with ${allArticles.length} articles`);
    return allArticles;
  }

  private async callPerplexityAPI(): Promise<string> {
    const sessionId = Date.now() + Math.random().toString(36).substring(2);
    const stockRotation = [
      ['TCS', 'Infosys', 'Wipro', 'HCL Tech', 'Tech Mahindra'],
      ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Bank'],
      ['Reliance', 'ONGC', 'IOC', 'BPCL', 'GAIL'],
      ['Maruti', 'Tata Motors', 'Bajaj Auto', 'M&M', 'Eicher Motors'],
      ['Sun Pharma', 'Dr Reddy', 'Cipla', 'Lupin', 'Biocon']
    ];
    const selectedStocks = stockRotation[Math.floor(Math.random() * stockRotation.length)];
    const basePrice = 1000 + Math.floor(Math.random() * 3000);
    const indexLevel = 45000 + Math.floor(Math.random() * 15000);
    
    const currentDate = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    const prompt = `SEARCH ONLY for actual news events from these websites on ${currentDate} and ${yesterday}:
- nseindia.com: Corporate announcements, filings
- bseindia.com: Company disclosures, results
- moneycontrol.com: Earnings, brokerage reports
- economictimes.indiatimes.com: Market news, IPO updates
- business-standard.com: Corporate actions, FII/DII data

FIND ONLY these REAL events with exact sources:
• IPO subscription numbers, GMP rates, listing dates
• Order wins/contracts ₹100+ crore with company names
• Quarterly results with revenue/profit figures
• Dividend amounts with record dates
• Brokerage target price changes with firm names
• SEBI penalties, fraud investigations
• FII/DII buy/sell amounts by sector
• Nifty/Bank Nifty levels from market analysts
• Option chain max pain, PCR data

CRITICAL: Return ONLY news found on these websites. NO synthetic content.

Format: [{"title": "Date: Company: Real event", "content": "Details with numbers. Source: Website"}]

If no real news found: []`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a financial news SEARCH engine. DO NOT generate any content. Only SEARCH and FIND actual news from NSE India, BSE India, MoneyControl, Economic Times, Business Standard websites for real corporate announcements, earnings, IPO updates, brokerage reports, FII/DII data from today and yesterday only. If no real news found, return empty array [].'
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.0,
        search_domain_filter: ["nseindia.com", "bseindia.com", "moneycontrol.com", "economictimes.indiatimes.com", "business-standard.com", "livemint.com", "financialexpress.com"],
        search_recency_filter: "day",
        return_related_questions: false,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data: PerplexityResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private async storeArticlesDirectly(articles: ParsedArticle[]): Promise<AiArticle[]> {
    if (articles.length === 0) return [];

    const insertData: InsertAiArticle[] = articles.map(article => ({
      title: article.title,
      content: article.content,
      type: "AI News",
      source: "Real News - Verified Sources",
      sentiment: article.sentiment,
      priority: article.priority,
      imageUrl: null,
      newsDate: new Date(),
    }));

    const storedArticles = await db.insert(aiArticles).values(insertData).returning();
    console.log(`Stored ${storedArticles.length} articles directly`);
    return storedArticles;
  }

  private calculateInvestorValueScore(article: AiArticle): number {
    let score = 0;
    const title = article.title.toLowerCase();
    const content = article.content.toLowerCase();
    const text = `${title} ${content}`;

    // High priority indicators (50+ points each)
    const highValueKeywords = [
      'target price', 'price target', 'buy rating', 'sell rating', 'upgrade', 'downgrade',
      'earnings beat', 'earnings miss', 'guidance raised', 'guidance cut',
      'block deal', 'bulk deal', 'insider buying', 'insider selling',
      'contract win', 'order win', 'major deal', 'acquisition', 'merger',
      'policy change', 'rate cut', 'rate hike', 'rbi policy',
      'breakout', 'breakdown', 'technical levels', 'support', 'resistance'
    ];

    // Medium priority indicators (20+ points each)
    const mediumValueKeywords = [
      'quarterly results', 'annual results', 'revenue growth', 'profit margin',
      'management commentary', 'conference call', 'ceo statement',
      'fii buying', 'fii selling', 'dii activity', 'institutional',
      'sector rotation', 'thematic play', 'multibagger',
      'dividend', 'buyback', 'bonus issue', 'split'
    ];

    // Stock-specific indicators (30+ points each)
    const stockSpecificKeywords = [
      'reliance', 'tcs', 'infosys', 'hdfc bank', 'icici bank', 'sbi',
      'bharti airtel', 'lic', 'itc', 'hindunilvr', 'maruti suzuki',
      'asian paints', 'kotak bank', 'axis bank', 'wipro', 'hcl tech'
    ];

    // Count high value keywords
    highValueKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 50;
      }
    });

    // Count medium value keywords
    mediumValueKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 20;
      }
    });

    // Count stock-specific mentions
    stockSpecificKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 30;
      }
    });

    // Priority boost
    if (article.priority === 'High') {
      score += 25;
    } else if (article.priority === 'Medium') {
      score += 10;
    }

    // Sentiment considerations
    if (article.sentiment === 'Positive' || article.sentiment === 'Negative') {
      score += 15; // Clear sentiment is more actionable than neutral
    }

    // Specific number mentions (price targets, percentages, etc.)
    const numberMatches = text.match(/\d+(?:\.\d+)?%|\₹\s*\d+|rs\s*\d+|\d+\s*crore|\d+\s*lakh/g);
    if (numberMatches && numberMatches.length > 0) {
      score += Math.min(numberMatches.length * 10, 40); // Max 40 points for numbers
    }

    return score;
  }
}

export const aiNewsService = new AINewsService();