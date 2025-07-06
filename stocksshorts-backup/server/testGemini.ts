import { GoogleGenAI } from "@google/genai";

async function testGeminiNews() {
  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  try {
    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{
          text: `Generate 3 authentic Indian stock market news articles from 27 Jun 2025 (last working day) with these requirements:

1. Only use REAL companies: TCS, Infosys, Reliance, HDFC Bank, ICICI Bank, Wipro, HCL Tech, etc.
2. Focus on actual business activities that could happen: quarterly results, contract wins, regulatory actions
3. Include specific monetary amounts in crores/lakhs
4. Each article exactly 350 characters including verification link
5. Format: "27 Jun: [Company] [Action]: [Details]" 

Return as JSON array with title, content, source, sentiment fields.

Example format:
{
  "articles": [
    {
      "title": "27 Jun: TCS Wins Major Banking Deal Worth ₹2,500 Crore",
      "content": "TCS secured a 5-year digital transformation contract with European bank worth ₹2,500 crore. Deal includes cloud migration, AI implementation, core banking modernization. Strengthens TCS position in BFSI vertical. <a href='https://economictimes.indiatimes.com' target='_blank' style='color: #3b82f6;'>Click here</a>",
      "source": "Economic Times",
      "sentiment": "Positive"
    }
  ]
}`
        }]
      }],
      config: {
        responseMimeType: "application/json"
      }
    });

    console.log('Gemini Response:', response.text);
    
    const result = JSON.parse(response.text || '{"articles": []}');
    console.log('Parsed Articles:', result.articles);
    
    return result.articles;
  } catch (error) {
    console.error('Gemini Test Error:', error);
    return [];
  }
}

testGeminiNews().then(articles => {
  console.log(`Generated ${articles.length} test articles`);
  process.exit(0);
}).catch(console.error);