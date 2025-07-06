import OpenAI from 'openai';
import { storage } from '../storage';
import { googleDriveService } from './googleDriveService';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class EnhancedAIService {
  private async getCompanyFromDatabase(companyName: string): Promise<any[]> {
    try {
      // Search for company-related data in your articles database
      const articles = await storage.getStoredAiArticles(100);
      
      // Filter articles related to the company
      const companyArticles = articles.filter(article => 
        article.title.toLowerCase().includes(companyName.toLowerCase()) ||
        article.content.toLowerCase().includes(companyName.toLowerCase())
      );

      return companyArticles;
    } catch (error) {
      console.error('Error getting company data from database:', error);
      return [];
    }
  }

  private async getPersonalizedArticles(companyName: string): Promise<any[]> {
    try {
      const personalizedArticles = await storage.getPersonalizedArticles(50);
      
      const companyRelated = personalizedArticles.filter(article => 
        article.title.toLowerCase().includes(companyName.toLowerCase()) ||
        article.content.toLowerCase().includes(companyName.toLowerCase())
      );

      return companyRelated;
    } catch (error) {
      console.error('Error getting personalized articles:', error);
      return [];
    }
  }

  private extractCompanyName(query: string): string {
    // Common company name patterns and variations
    const companyMappings: { [key: string]: string } = {
      'reliance': 'Reliance Industries',
      'tcs': 'TCS',
      'infosys': 'Infosys',
      'hdfc': 'HDFC Bank',
      'icici': 'ICICI Bank',
      'wipro': 'Wipro',
      'hcl': 'HCL Technologies',
      'bajaj': 'Bajaj Finance',
      'sbi': 'SBI',
      'adani': 'Adani Group',
      'bharti': 'Bharti Airtel',
      'itc': 'ITC',
      'larsen': 'L&T',
      'mahindra': 'Mahindra',
      'maruti': 'Maruti Suzuki'
    };

    const queryLower = query.toLowerCase();
    
    // Check for exact mappings first
    for (const [key, value] of Object.entries(companyMappings)) {
      if (queryLower.includes(key)) {
        return value;
      }
    }

    // Extract potential company names from the query
    const words = query.split(' ');
    const potentialCompanies = words.filter(word => 
      word.length > 2 && 
      (word.toUpperCase() === word || // All caps (like TCS, HDFC)
       word.charAt(0) === word.charAt(0).toUpperCase()) // Capitalized
    );

    // Return the first potential company name or the whole query if no clear company
    return potentialCompanies.length > 0 ? potentialCompanies.join(' ') : query.split(' ')[0];
  }

  async processAIQuery(query: string, userId?: number): Promise<{
    response: string;
    sources: string[];
    databaseResults: number;
    driveResults: number;
  }> {
    try {
      const companyName = this.extractCompanyName(query);
      
      // 1. Get data from your database
      const databaseResults = await this.getCompanyFromDatabase(companyName);
      const personalizedResults = await this.getPersonalizedArticles(companyName);

      // 2. Try Google Drive (optional - requires service account credentials)
      let driveData = { folders: [], documents: [], sheets: [], content: [] };
      
      // Only attempt Google Drive if we have proper service account credentials
      if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        try {
          console.log(`Searching Google Drive for company: ${companyName}`);
          driveData = await googleDriveService.searchCompanyData(companyName);
          console.log(`Google Drive results: ${driveData.folders.length} folders, ${driveData.documents.length} documents, ${driveData.sheets.length} sheets, ${driveData.content.length} content items`);
        } catch (driveError) {
          console.log('Google Drive access failed, continuing with other sources');
        }
      } else {
        console.log('Google Drive credentials not configured, using database and web search instead');
      }

      // 3. Prepare context for OpenAI
      let context = '';
      const sources: string[] = [];

      // Add database content
      if (databaseResults.length > 0) {
        context += '\n\n=== FROM YOUR DATABASE ===\n';
        databaseResults.forEach(article => {
          context += `Title: ${article.title}\nContent: ${article.content}\nDate: ${article.createdAt}\n\n`;
        });
        sources.push(`${databaseResults.length} articles from your database`);
      }

      // Add personalized articles
      if (personalizedResults.length > 0) {
        context += '\n\n=== PERSONALIZED ARTICLES ===\n';
        personalizedResults.forEach(article => {
          context += `Title: ${article.title}\nContent: ${article.content}\nInsights: ${article.insights}\n\n`;
        });
        sources.push(`${personalizedResults.length} personalized articles`);
      }

      // Add Google Drive content
      if (driveData.content.length > 0) {
        context += '\n\n=== FROM YOUR GOOGLE DRIVE ===\n';
        driveData.content.forEach(content => {
          context += content + '\n\n';
        });
        // Use specific document names as sources
        if (driveData.documentNames && driveData.documentNames.length > 0) {
          driveData.documentNames.forEach(docName => {
            sources.push(docName);
          });
        } else {
          sources.push(`${driveData.content.length} documents from Google Drive`);
        }
      }

      // 4. If insufficient data from database and drive, supplement with web search
      let webSearchNeeded = false;
      const totalDataSources = databaseResults.length + personalizedResults.length + driveData.content.length;
      
      if (totalDataSources < 2) {
        webSearchNeeded = true;
        console.log(`Limited data found (${totalDataSources} sources). Web search may be needed for comprehensive analysis.`);
      }

      // 5. Create enhanced prompt for OpenAI with source priority instructions
      const enhancedPrompt = `
Answer the user's specific question directly using the provided data.

USER QUERY: ${query}

AVAILABLE DATA:
${context}

INSTRUCTIONS:
- Answer ONLY the specific question asked
- Use exact numbers and facts from the provided documents
- Be specific and factual, not general
- Keep response focused and direct
- Do NOT provide general updates or background information unless asked
- Cite specific document names as sources (not "Google Drive" or "database")

Answer directly and end with: Sources: [specific document names]
`;

      // 5. Get OpenAI response
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert financial analyst with access to the user's personal research database and Google Drive company folders. Provide detailed, data-driven analysis."
          },
          {
            role: "user",
            content: enhancedPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      const response = completion.choices[0].message.content || "Unable to process your query at this time.";

      // 6. Store the query for future reference
      if (userId) {
        await storage.createAiQuery({
          userId,
          query,
          response,
          sources: sources.join(', ')
        });
      }

      return {
        response,
        sources,
        databaseResults: databaseResults.length + personalizedResults.length,
        driveResults: driveData.content.length
      };

    } catch (error) {
      console.error('Error in enhanced AI service:', error);
      return {
        response: "I apologize, but I encountered an error while processing your query. Please try again.",
        sources: [],
        databaseResults: 0,
        driveResults: 0
      };
    }
  }

  async suggestCompanySetup(companyName: string): Promise<{
    suggestions: string[];
    folderStructure: string[];
  }> {
    try {
      const suggestions = [
        `Create a folder named "${companyName}" in your Google Drive`,
        `Add subfolders: "Financial Reports", "Research Notes", "News Articles", "Conference Calls"`,
        `Upload company annual reports and quarterly results`,
        `Save analyst reports and research notes`,
        `Keep conference call transcripts and management presentations`,
        `Add any company-specific news articles or press releases`
      ];

      const folderStructure = [
        `📁 ${companyName}/`,
        `  📁 Financial Reports/`,
        `    📄 Annual Report 2024.pdf`,
        `    📄 Q4 FY24 Results.pdf`,
        `    📄 Investor Presentation.pdf`,
        `  📁 Research Notes/`,
        `    📄 Company Analysis.docx`,
        `    📄 Competitive Analysis.docx`,
        `  📁 News & Updates/`,
        `    📄 Recent News.txt`,
        `    📄 Management Commentary.txt`,
        `  📁 Conference Calls/`,
        `    📄 Q4 FY24 Transcript.txt`,
        `    📄 Management Guidance.txt`
      ];

      return { suggestions, folderStructure };
    } catch (error) {
      console.error('Error generating company setup suggestions:', error);
      return { suggestions: [], folderStructure: [] };
    }
  }
}

export const enhancedAIService = new EnhancedAIService();