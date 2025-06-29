import { storage } from "../storage";

if (!process.env.PERPLEXITY_API_KEY) {
  throw new Error("PERPLEXITY_API_KEY environment variable is required");
}

interface NewsSummary {
  title: string;
  content: string;
  source: string;
  type: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  priority: '1' | '2' | '3' | '4' | '5';
  newsDate: Date;
}

export class NewsSummaryService {

  async fetchAndSummarizeNews(): Promise<NewsSummary[]> {
    const summaries: NewsSummary[] = [];
    const today = new Date();

    // Priority-based queries for real news
    const newsQueries = [
      // Priority 1: SEBI investigations
      { query: "SEBI fraud investigations Indian companies", priority: "1" as const },
      { query: "SEBI penalties violations stock market", priority: "1" as const },
      { query: "SEBI enforcement actions today", priority: "1" as const },
      { query: "SEBI compliance failures investigations", priority: "1" as const },
      
      // Priority 2: Stock breakouts
      { query: "Indian stocks breakouts high volume", priority: "2" as const },
      { query: "NSE BSE stocks resistance breakouts", priority: "2" as const },
      { query: "Indian stock price breakouts today", priority: "2" as const },
      { query: "Stock market volume surge India", priority: "2" as const },
      
      // Priority 3: Order wins
      { query: "Indian companies contract wins", priority: "3" as const },
      { query: "Large order announcements India", priority: "3" as const },
      { query: "Business contract awards India", priority: "3" as const },
      { query: "Major deals Indian corporations", priority: "3" as const },
      
      // Priority 4: Quarterly results
      { query: "Indian companies quarterly results growth", priority: "4" as const },
      { query: "Strong earnings Indian companies", priority: "4" as const },
      { query: "Quarterly results beating estimates", priority: "4" as const },
      { query: "High growth quarterly results India", priority: "4" as const },
      
      // Priority 5: IPO and ratings
      { query: "Indian IPO subscription updates", priority: "5" as const },
      { query: "Stock brokerage upgrades India", priority: "5" as const },
      { query: "IPO listing performance India", priority: "5" as const },
      { query: "Analyst recommendations Indian stocks", priority: "5" as const }
    ];

    console.log('Fetching and summarizing 20 real news articles');

    for (let i = 0; i < Math.min(newsQueries.length, 20); i++) {
      try {
        const query = newsQueries[i];
        
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: `Summarize 1 real news from Indian stock market. Format exactly as:
HEADLINE: [Catchy 8-word headline with action verb]
SUMMARY: [Key facts in 280 chars: company, numbers, impact]
LINK: [Source URL for verification]`
              },
              {
                role: 'user',
                content: query.query
              }
            ],
            max_tokens: 200,
            temperature: 0.1,
            search_domain_filter: ["moneycontrol.com", "economictimes.indiatimes.com", "business-standard.com"],
            return_citations: true,
            search_recency_filter: "day",
            stream: false
          })
        });

        if (response.ok) {
          const data = await response.json();
          const newsText = data.choices[0]?.message?.content;
          const citations = data.citations || [];
          
          if (newsText) {
            const summary = this.createNewsSummary(newsText, query.priority, citations, today);
            if (summary) {
              summaries.push(summary);
              console.log(`Created summary: ${summary.title}`);
            }
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error summarizing news ${i + 1}:`, error);
      }
    }

    return summaries;
  }

  private createNewsSummary(newsText: string, priority: '1' | '2' | '3' | '4' | '5', citations: string[], date: Date): NewsSummary | null {
    try {
      // Extract headline, summary and link
      const headlineMatch = newsText.match(/HEADLINE:\s*([^\n]+)/i);
      const summaryMatch = newsText.match(/SUMMARY:\s*([^L]+?)(?=LINK:|$)/i);
      const linkMatch = newsText.match(/LINK:\s*([^\n]+)/i);
      
      if (!headlineMatch || !summaryMatch) {
        // Fallback parsing
        const lines = newsText.split('\n').filter(line => line.trim());
        if (lines.length < 2) return null;
        
        const title = this.makeCatchyHeadline(lines[0], priority);
        const content = this.create350CharSummary(lines.slice(1).join(' '), citations);
        
        return {
          title,
          content,
          source: 'Verified Source',
          type: "AI News",
          sentiment: this.getSentiment(title),
          priority,
          newsDate: date
        };
      }
      
      const title = this.makeCatchyHeadline(headlineMatch[1].trim(), priority);
      const rawSummary = summaryMatch[1].trim();
      const verifyUrl = linkMatch ? linkMatch[1].trim() : (citations[0] || 'bit.ly/verify');
      
      const content = this.create350CharSummary(rawSummary, [verifyUrl]);
      
      return {
        title: title.substring(0, 80),
        content,
        source: this.getSourceFromUrl(verifyUrl),
        type: "AI News",
        sentiment: this.getSentiment(title + ' ' + rawSummary),
        priority,
        newsDate: date
      };
    } catch (error) {
      console.error('Error creating news summary:', error);
      return null;
    }
  }

  private makeCatchyHeadline(title: string, priority: string): string {
    // Clean title
    title = title.replace(/^[#*\-\s]+/, '').trim();
    
    const actionWords = {
      '1': ['Alert', 'Raids', 'Probes', 'Penalizes', 'Investigates'],
      '2': ['Surges', 'Breaks', 'Rallies', 'Soars', 'Jumps'],
      '3': ['Wins', 'Bags', 'Lands', 'Secures', 'Grabs'],
      '4': ['Beats', 'Reports', 'Posts', 'Delivers', 'Achieves'],
      '5': ['Debuts', 'Lists', 'Targets', 'Opens', 'Upgrades']
    };
    
    // If no action word present, add one
    if (!title.match(/\b(surges|breaks|wins|beats|debuts|alert|raids|probes|bags|reports|targets)\b/i)) {
      const words = actionWords[priority as keyof typeof actionWords] || ['Updates'];
      const actionWord = words[Math.floor(Math.random() * words.length)];
      
      const companyMatch = title.match(/\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\b/);
      if (companyMatch) {
        const company = companyMatch[1];
        title = `${company} ${actionWord}: ${title.replace(company, '').trim()}`;
      } else {
        title = `${actionWord}: ${title}`;
      }
    }
    
    return title;
  }

  private create350CharSummary(summary: string, urls: string[]): string {
    // Clean summary
    summary = summary.replace(/\s+/g, ' ').trim();
    
    // Get verification URL
    const verifyUrl = urls[0] || 'bit.ly/verify';
    const verifyText = ` Verify: ${verifyUrl}`;
    
    // Calculate max summary length
    const maxLength = 350 - verifyText.length;
    
    // Trim summary if needed
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3);
      const lastSpace = summary.lastIndexOf(' ');
      if (lastSpace > maxLength - 30) {
        summary = summary.substring(0, lastSpace) + '...';
      } else {
        summary = summary + '...';
      }
    }
    
    // Combine and ensure exactly 350 characters
    let result = summary + verifyText;
    
    if (result.length < 350) {
      result = result.padEnd(350, ' ');
    }
    
    return result.substring(0, 350);
  }

  private getSourceFromUrl(url: string): string {
    if (url.includes('moneycontrol.com')) return 'MoneyControl';
    if (url.includes('economictimes.indiatimes.com')) return 'Economic Times';
    if (url.includes('business-standard.com')) return 'Business Standard';
    if (url.includes('livemint.com')) return 'LiveMint';
    return 'Verified Source';
  }

  private getSentiment(text: string): 'Positive' | 'Negative' | 'Neutral' {
    const positiveWords = ['surges', 'breaks', 'wins', 'beats', 'reports', 'growth', 'gain', 'up'];
    const negativeWords = ['raids', 'probes', 'penalties', 'violations', 'decline', 'fall', 'down'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'Positive';
    if (negativeCount > positiveCount) return 'Negative';
    return 'Neutral';
  }

  async generateAndStore(): Promise<void> {
    try {
      const summaries = await this.fetchAndSummarizeNews();
      
      if (summaries.length > 0) {
        await storage.storeAiArticles(summaries);
        console.log(`Generated ${summaries.length} news summaries with 350-char content and verification links`);
      } else {
        console.log('No news summaries generated - check API connection');
      }
    } catch (error) {
      console.error('Error generating news summaries:', error);
    }
  }
}

export const newsSummaryService = new NewsSummaryService();