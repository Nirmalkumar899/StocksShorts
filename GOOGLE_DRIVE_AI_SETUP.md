# Google Drive AI Setup Guide

Your AI feature now reads from your database and Google Drive to provide personalized stock analysis. Here's how to organize your Google Drive for maximum AI effectiveness.

## Quick Setup

### 1. Create Company Folders

For each company you research, create a dedicated folder structure:

```
📁 TCS/
  📁 Financial Reports/
    📄 Annual Report 2024.pdf
    📄 Q4 FY24 Results.pdf
  📁 Research Notes/
    📄 Company Analysis.docx
    📄 Competitive Position.txt
  📁 Conference Calls/
    📄 Q4 FY24 Transcript.txt
    📄 Management Guidance.docx
  📁 News & Updates/
    📄 Recent Developments.txt

📁 Reliance Industries/
  📁 Financial Reports/
  📁 Research Notes/
  📁 Conference Calls/
  📁 News & Updates/
```

### 2. Supported File Types

The AI can read these file formats:
- **Google Docs** (.gdoc) - Automatically converted to text
- **Google Sheets** (.gsheet) - Exported as CSV data
- **Text files** (.txt) - Direct content reading
- **PDF files** - Content extraction (limited)

### 3. Naming Conventions

Use clear, descriptive names:
- `TCS Q4 FY24 Analysis.docx`
- `Reliance Conference Call Notes.txt`
- `HDFC Bank Competitive Analysis.gdoc`
- `Infosys Financial Metrics.gsheet`

## Advanced Organization

### Company Research Template

Create this folder structure for comprehensive coverage:

```
📁 [Company Name]/
  📁 01-Financial Reports/
    📄 Annual Report [Year].pdf
    📄 Q[1-4] FY[Year] Results.pdf
    📄 Investor Presentation [Date].pdf
  
  📁 02-Management Commentary/
    📄 Conference Call Transcripts/
    📄 Management Interviews.txt
    📄 Guidance Updates.docx
  
  📁 03-Research Analysis/
    📄 Business Model Analysis.gdoc
    📄 Competitive Position.gdoc
    📄 SWOT Analysis.txt
    📄 Valuation Models.gsheet
  
  📁 04-Market Intelligence/
    📄 Industry Reports.pdf
    📄 Sector Analysis.docx
    📄 Peer Comparison.gsheet
  
  📁 05-News & Updates/
    📄 Recent News.txt
    📄 Regulatory Updates.txt
    📄 Corporate Actions.txt
```

## AI Integration Benefits

### What the AI Can Do

When you ask about a company, the AI will:

1. **Search your database** for related articles
2. **Scan Google Drive** for company folders
3. **Read documents** from financial reports to research notes
4. **Analyze spreadsheets** with financial data
5. **Combine insights** from all sources for comprehensive analysis

### Example AI Capabilities

Ask: "Analyze TCS for investment"

AI Response will include:
- Data from your saved TCS articles
- Content from your TCS Google Drive folder
- Recent financial reports you've uploaded
- Your personal research notes and analysis
- Combined with real-time market data

## Best Practices

### 1. Regular Updates
- Add quarterly results immediately after release
- Update research notes with new insights
- Save relevant news articles in company folders

### 2. Consistent Structure
- Use the same folder structure for all companies
- Maintain consistent naming conventions
- Keep files organized by date and type

### 3. Quality Content
- Include detailed analysis, not just raw data
- Add your personal insights and conclusions
- Link related companies and sector trends

### 4. Data Sources
- Annual reports from company websites
- Conference call transcripts from investor relations
- Research reports from brokerages
- Your personal analysis and notes
- Industry reports and competitive analysis

## API Configuration

The AI uses your existing Google Sheets credentials to access Google Drive:

- **Service Account**: Same as your Google Sheets integration
- **Permissions**: Read-only access to your Google Drive
- **Security**: Files are read but never modified
- **Privacy**: Only you can access your personal folders

## Testing Your Setup

1. Create a test folder: "Test Company"
2. Add a simple document with company information
3. Ask AI: "What do you know about Test Company?"
4. Check if AI mentions finding your Google Drive content

## Troubleshooting

### Common Issues

**AI not finding files:**
- Check folder names match company names mentioned in queries
- Ensure files are in Google Drive root or shared folders
- Verify Google Drive permissions in service account

**No content extracted:**
- Make sure files are in supported formats
- Check if documents have readable text content
- Try converting PDFs to Google Docs for better extraction

**Slow responses:**
- Large files take longer to process
- Limit folder contents to most relevant files
- Use text files for faster processing

## Privacy & Security

- Your Google Drive content is processed securely
- No data is stored permanently on servers
- Only search queries and responses are logged
- Files are read-only, never modified
- Service account has minimal required permissions

## Support

For setup assistance:
1. Check this guide first
2. Test with simple files initially
3. Contact support with specific error messages
4. Provide folder names and file types for troubleshooting

Start with 2-3 companies and expand your organization system as you see the AI's enhanced capabilities in action.