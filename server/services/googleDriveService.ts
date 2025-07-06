import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export class GoogleDriveService {
  private auth: JWT;
  private drive: any;

  constructor() {
    this.auth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ]
    });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  async searchCompanyFolders(companyName: string): Promise<any[]> {
    try {
      const response = await this.drive.files.list({
        q: `name contains '${companyName}' and mimeType = 'application/vnd.google-apps.folder'`,
        fields: 'files(id,name,parents)',
        orderBy: 'name'
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error searching company folders:', error);
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
      // Search for company folders
      const folders = await this.searchCompanyFolders(companyName);
      
      // Search for company documents
      const docResponse = await this.drive.files.list({
        q: `name contains '${companyName}' and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'text/plain' or mimeType = 'application/pdf')`,
        fields: 'files(id,name,mimeType,modifiedTime)',
        orderBy: 'modifiedTime desc'
      });

      // Search for company spreadsheets
      const sheetResponse = await this.drive.files.list({
        q: `name contains '${companyName}' and mimeType = 'application/vnd.google-apps.spreadsheet'`,
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