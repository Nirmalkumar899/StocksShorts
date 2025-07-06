import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export class GoogleDriveService {
  private drive: any;

  constructor() {
    // Try to load from JSON file first (more reliable)
    try {
      const fs = require('fs');
      const path = require('path');
      const jsonPath = path.join(process.cwd(), 'attached_assets', 'spartan-perigee-463004-u2-e5ae8eae0c60_1751807506284.json');
      
      if (fs.existsSync(jsonPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log('Google Drive: Using service account from JSON file');
        
        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: "stocksshortsnew@spartan-perigee-463004-u2.iam.gserviceaccount.com",
            private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDxm4erbCGs0tHQ
Mri1jp9AcFU6KMEnywtSCFhKtgDS5IhrjtAPnATmeBz9UusIW1omj8/9oMdb75cc
rdrrcrQSBh3fQ6FmNeAoeJJ/UIaEAJs1hDqmzoMLGC/qinhqn0ZVqcAlRMyI4n2A
1g0ApZTKLI1etmeVRlbvlPmwbLg8hjk89qxSkBKTZevs5870wmgwFx60e+/TPCvn
3yGmskLUasLKveeW+x0UEmL/GWDYv8e+wXuepCUc4MOIQvMb6u2LhAAcCn5dO8BM
lDvI1Pr1lRcHE0qk6vmz4wuF5l+FhR0ylhl4wvrhQ/hAuLOgneTLpQWW8f0aXLzM
wy6VlxbdAgMBAAECggEABYhBGGH6Qf5QYN+OKjBjWGm+pCIRMZ3a0dyLxQK/uoI2
+3bwL/orqSAuQAnZO3UcnCBvUG0RQURy05E3RCNVBqYOfgzmUf139ynXng0dVkIE
cF8yhpyPy3Th9/8Y/KCXc6Fo7ZGJgkd3GF0OYLwOdH080FBzopkKFP9R7AswHaRX
Mp2W6CLeZXkRa049NKn/z5cIv0SCcyJOJ/p2v3WhmbNfK0vKXfdVFUjB8FvVs30F
L2AI3qp4avNbvE8xSWNKVw9ckck8B+lD9V65tgNUhrtgaUUjIgOBLEwM4o1DaotV
dizo8w62HHNun+0pNVnWXWv3QevRDo09zr6jR1+P0wKBgQD+T9VWv+gRZcbchZhG
IIIiHtbp8aCuk/aNCVcoOSyYtA2MVpSoFW/qXqXMg7KAOoIjwbES+y+qjZM+IeVc
2cMii6PT6QLoTG5WQ6qVqf4Vg8zt/lFd4dGADXLpn8b0t1h4+cl/HYjjI0BNYyn+
yH7ol8DarD0vKZlK+tIetHlA/wKBgQDzNhuBgs4T9VTe0XEN3z5mxQJ9v4KuAzpv
CuCPH+LY35RyQTWTesVyhwBLxD9TeE6PiP+mF1C2gzRZ5O8THoM6kaAqcZ9GbB3r
h10/r+XaYcAeM2wJDg1LbcNKQ2+8VUpiexjDjE5aOL+/Aefz3USA1/6dmW4fHeIg
b+iNfsjMIwKBgBhtZKmTf2AEbaiK8Ihz4OwUGEKaYfvC3KDJb+S+MSltygtb2aWX
gYt6keRmFgQ5Gn0CwtZ26CoytRz3todHp3WvAgp9zDix9rs0frMng+9fHJUTo48n
/K6XHB2SqlKhNc9Q9ujN1nMy1J9aUhNWANKomO6oMqxQC5hnJT2ryiXTAoGBAISQ
94kuTTmfvbT+IEtZZeAKfoMgQhCrfcxM933L+ZAQvg9Q7+0FPF5iq4yg2YubxeaC
3CYiC0KQXZaqLI4VUZ45Bj5cVF7ES8K3s+Ik9HqGUXukt7xvxltY5tuxylOzgaoQ
Qr1D2uleiVWJqm7IKrC4CvbITLf1R+46UV3ev4BVAoGAWhmoUJhwpOZmKoKQ1e3l
4ZwoB4O5gQIlCxkeDlWE/2e2x51nUsDZIF4iY7iq8o9phcleFx9AgfgrNZ89MbAr
+2hyEr0BnNGEeiNg+ZNiqcLaIIr/yG8qCSsf3LGc4jZD6m7cFAj6qwM491S0M4/v
0HsI2X6g//ccL7BPi5ZPKRY=
-----END PRIVATE KEY-----`,
          },
          scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        this.drive = google.drive({ version: 'v3', auth });
        return;
      }
    } catch (error) {
      console.log('Failed to load from JSON file, falling back to environment variables:', error.message);
    }

    // Fallback to environment variables
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        console.log('Google Drive: Using environment variables');
        let privateKey = process.env.GOOGLE_PRIVATE_KEY;
        
        // Handle different private key formats
        if (privateKey.includes('\\n')) {
          privateKey = privateKey.replace(/\\n/g, '\n');
        }
        
        // Ensure proper line breaks for the key
        if (!privateKey.includes('\n') && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
          privateKey = privateKey
            .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
            .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
        }

        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: privateKey,
          },
          scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        this.drive = google.drive({ version: 'v3', auth });
        console.log('Google Drive service initialized with service account credentials');
      } catch (error) {
        console.error('Error initializing Google Drive service account:', error);
        this.drive = null;
      }
    } else if (process.env.GOOGLE_API_KEY) {
      // Fallback to API key (only works for public files)
      this.drive = google.drive({ 
        version: 'v3', 
        auth: process.env.GOOGLE_API_KEY 
      });
    } else {
      // No credentials available
      this.drive = null;
    }
  }

  async findAIDatabaseFolder(): Promise<string | null> {
    // Use the specific folder ID provided by the user
    const specificFolderId = '1eqDB7dEOVDHhOA4xMagH0sO4soe6EcMW';
    
    try {
      // Check if drive is initialized
      if (!this.drive) {
        console.log('Google Drive not initialized. Need GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY for private folders, or GOOGLE_API_KEY for public folders.');
        return null;
      }

      // Verify the folder exists and is accessible
      const response = await this.drive.files.get({
        fileId: specificFolderId,
        fields: 'id,name,mimeType'
      });

      if (response.data && response.data.mimeType === 'application/vnd.google-apps.folder') {
        console.log(`Successfully connected to AI Database folder: ${response.data.name} (${specificFolderId})`);
        return specificFolderId;
      } else {
        console.error('Specified folder ID is not a valid folder');
        return null;
      }
    } catch (error) {
      console.error('Error accessing AI Database folder:', error);
      console.log('This folder is likely private. You need to provide GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY credentials and share the folder with the service account email.');
      return null;
    }
  }

  async searchCompanyFolders(companyName: string): Promise<any[]> {
    try {
      // Access the specific AI Database folder
      const aiDatabaseId = await this.findAIDatabaseFolder();
      if (!aiDatabaseId) {
        console.log('Cannot access the specified AI Database folder');
        return [];
      }
      console.log(`Using AI Database folder with ID: ${aiDatabaseId}`);

      // Search for company folder within the specific AI Database folder
      // Try multiple search patterns to find the company folder
      const searchPatterns = [
        companyName, // Exact match
        companyName.split(' ')[0], // First word only
        companyName.toLowerCase(),
        companyName.toUpperCase()
      ];

      let allFolders: any[] = [];
      
      for (const pattern of searchPatterns) {
        const response = await this.drive.files.list({
          q: `name contains '${pattern}' and '${aiDatabaseId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
          fields: 'files(id,name,parents)',
          orderBy: 'name'
        });
        
        const folders = response.data.files || [];
        console.log(`Search pattern "${pattern}" found ${folders.length} folders:`, folders.map(f => f.name));
        allFolders = allFolders.concat(folders);
      }

      // Remove duplicates based on folder ID
      const uniqueFolders = allFolders.filter((folder, index, self) => 
        index === self.findIndex(f => f.id === folder.id)
      );

      return uniqueFolders;
    } catch (error) {
      console.error('Error searching company folders in AI Database:', error);
      return [];
    }
  }

  async listAllFoldersInAIDatabase(): Promise<any[]> {
    try {
      const aiDatabaseId = await this.findAIDatabaseFolder();
      if (!aiDatabaseId) {
        return [];
      }

      const response = await this.drive.files.list({
        q: `'${aiDatabaseId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
        fields: 'files(id,name)',
        orderBy: 'name'
      });

      const folders = response.data.files || [];
      console.log(`Available company folders in AI Database:`, folders.map(f => f.name));
      return folders;
    } catch (error) {
      console.error('Error listing folders in AI Database:', error);
      return [];
    }
  }

  async getFilesFromFolder(folderId: string): Promise<any[]> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents`,
        fields: 'files(id,name,mimeType,modifiedTime,size)',
        orderBy: 'modifiedTime desc'
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error getting files from folder:', error);
      return [];
    }
  }

  async getFileContent(fileId: string): Promise<string> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file content:', error);
      return '';
    }
  }

  async exportGoogleDoc(fileId: string): Promise<string> {
    try {
      const response = await this.drive.files.export({
        fileId: fileId,
        mimeType: 'text/plain'
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting Google Doc:', error);
      return '';
    }
  }

  async exportGoogleSheet(fileId: string): Promise<string> {
    try {
      const response = await this.drive.files.export({
        fileId: fileId,
        mimeType: 'text/csv'
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting Google Sheet:', error);
      return '';
    }
  }

  async searchCompanyData(companyName: string): Promise<{
    folders: any[],
    documents: any[],
    sheets: any[],
    content: string[]
  }> {
    try {
      // First find the AI Database folder
      const aiDatabaseId = await this.findAIDatabaseFolder();
      if (!aiDatabaseId) {
        console.log('AI Database folder not found, returning empty results');
        return { folders: [], documents: [], sheets: [], content: [] };
      }

      // Search for company folders within AI Database
      const folders = await this.searchCompanyFolders(companyName);
      
      // Search for company documents within AI Database folder
      const docResponse = await this.drive.files.list({
        q: `name contains '${companyName}' and '${aiDatabaseId}' in parents and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'text/plain' or mimeType = 'application/pdf')`,
        fields: 'files(id,name,mimeType,modifiedTime)',
        orderBy: 'modifiedTime desc'
      });

      // Search for company spreadsheets within AI Database folder
      const sheetResponse = await this.drive.files.list({
        q: `name contains '${companyName}' and '${aiDatabaseId}' in parents and mimeType = 'application/vnd.google-apps.spreadsheet'`,
        fields: 'files(id,name,mimeType,modifiedTime)',
        orderBy: 'modifiedTime desc'
      });

      const documents = docResponse.data.files || [];
      const sheets = sheetResponse.data.files || [];

      // Extract content from documents
      const content: string[] = [];
      
      // Get content from up to 5 most recent documents
      for (const doc of documents.slice(0, 5)) {
        let docContent = '';
        
        if (doc.mimeType === 'application/vnd.google-apps.document') {
          docContent = await this.exportGoogleDoc(doc.id);
        } else if (doc.mimeType === 'text/plain') {
          docContent = await this.getFileContent(doc.id);
        }
        
        if (docContent) {
          content.push(`Document: ${doc.name}\n${docContent}`);
        }
      }

      // Get content from up to 3 most recent spreadsheets
      for (const sheet of sheets.slice(0, 3)) {
        const sheetContent = await this.exportGoogleSheet(sheet.id);
        if (sheetContent) {
          content.push(`Spreadsheet: ${sheet.name}\n${sheetContent}`);
        }
      }

      // Get content from files in company folders
      for (const folder of folders.slice(0, 3)) {
        const folderFiles = await this.getFilesFromFolder(folder.id);
        
        for (const file of folderFiles.slice(0, 3)) {
          let fileContent = '';
          
          if (file.mimeType === 'application/vnd.google-apps.document') {
            fileContent = await this.exportGoogleDoc(file.id);
          } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
            fileContent = await this.exportGoogleSheet(file.id);
          } else if (file.mimeType === 'text/plain') {
            fileContent = await this.getFileContent(file.id);
          }
          
          if (fileContent) {
            content.push(`File from ${folder.name}: ${file.name}\n${fileContent}`);
          }
        }
      }

      return {
        folders,
        documents,
        sheets,
        content
      };
    } catch (error) {
      console.error('Error searching company data:', error);
      return {
        folders: [],
        documents: [],
        sheets: [],
        content: []
      };
    }
  }
}

export const googleDriveService = new GoogleDriveService();