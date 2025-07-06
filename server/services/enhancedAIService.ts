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
      
      // Only use Google Drive data - no database or other sources
      let driveData = { folders: [], documents: [], sheets: [], content: [], documentNames: [] };
      
      // Only attempt Google Drive if we have proper service account credentials
      if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        try {
          console.log(`Searching for company: ${companyName}`);
          driveData = await googleDriveService.searchCompanyData(companyName);
          console.log(`Found: ${driveData.folders.length} folders, ${driveData.documents.length} documents, ${driveData.sheets.length} sheets, ${driveData.content.length} content items`);
          
          // Log specific documents being analyzed
          if (driveData.documentNames && driveData.documentNames.length > 0) {
            console.log(`AI analyzing documents: ${driveData.documentNames.join(', ')}`);
          }
        } catch (driveError) {
          console.log('Data access failed');
        }
      } else {
        console.log('Data credentials not configured');
      }

      // Prepare context for OpenAI using only Google Drive data
      let context = '';
      const sources: string[] = [];

      // Add only Google Drive content
      if (driveData.content.length > 0) {
        context += '\n\n=== AVAILABLE DATA ===\n';
        driveData.content.forEach(content => {
          context += content + '\n\n';
        });
        // Use specific document names as sources
        if (driveData.documentNames && driveData.documentNames.length > 0) {
          driveData.documentNames.forEach(docName => {
            sources.push(docName);
          });
        }
        
        // Debug log to check content
        console.log(`Context length: ${context.length} characters`);
        console.log(`First 500 characters of context:`, context.substring(0, 500));
      }

      // 5. Create enhanced prompt for OpenAI with instructions
      const hasData = context.trim() !== '';
      const sourcesList = sources.length > 0 ? sources.join(', ') : 'No documents available';
      
      const enhancedPrompt = `
USER QUERY: ${query}

AVAILABLE DATA:
${context}

INSTRUCTIONS:
${!hasData ? 
  'NO DATA AVAILABLE - Respond: "Sorry, this information is not available in our current data. We are working on expanding our coverage."' : 
  `ANALYZE THE PROVIDED DOCUMENTS and provide a comprehensive investment analysis based on the available data. 

Structure your response as:

## 📊 Investment Analysis Summary

**Key Financial Highlights:**
- Revenue, profit, and growth metrics from documents
- Important financial ratios and margins

**Recent Performance:**
- Latest quarterly results and year-over-year growth
- Management commentary on performance

**Business Outlook:**
- Management guidance and forward-looking statements
- Strategic initiatives and growth plans

**Investment Perspective:**
- Key strengths and opportunities identified
- Risk factors mentioned in documents

Sources: ${sourcesList}

Use exact numbers and dates from the documents. Focus on actionable investment insights.`
}
`;

      // 5. Get OpenAI response with timeout and error handling
      let response: string;
      try {
        console.log('Sending to OpenAI - hasData:', hasData);
        console.log('Source list:', sourcesList);
        console.log('Prompt preview:', enhancedPrompt.substring(0, 300) + '...');
        
        const completion = await Promise.race([
          openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are an expert financial analyst. Analyze the provided company documents and create comprehensive investment insights based on the available data. Focus on key financial metrics, growth trends, management outlook, and investment implications from the documents."
              },
              {
                role: "user",
                content: enhancedPrompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.3
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('OpenAI request timeout')), 30000)
          )
        ]);
        
        response = completion.choices[0].message.content || "Sorry, this information is not available in our current data. We are working on expanding our coverage.";
        console.log('OpenAI response received successfully');
        console.log('Response preview:', response.substring(0, 200) + '...');
      } catch (error) {
        console.error('OpenAI API error:', error);
        response = "Sorry, I'm experiencing technical difficulties. Please try again in a moment.";
      }

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
        databaseResults: 0,
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